import type { Circuit, CircuitNode, GateType, PortKind, SimulationResult, Wire } from './types'

const MAX_ITERATIONS = 100

export function simulate(circuit: Circuit): SimulationResult {
  const outputs: Record<string, boolean> = {}
  const lights: Record<string, boolean> = {}
  const errors: string[] = []
  const portKindById = buildPortKindLookup(circuit)
  const groupInputLookup = buildGroupInputLookup(circuit, portKindById)
  const groupOutputLookup = buildGroupOutputLookup(circuit)

  // Seed with switches
  circuit.nodes.forEach((node) => {
    if (node.type === 'switch') {
      outputs[node.data.outputPortId] = node.data.state
    }
  })

  let iterations = 0
  let changed = true

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false
    iterations += 1

    // propagate group inputs (supports both legacy mapping to internal inputs and v1.2 mapping to junction outputs)
    circuit.nodes.forEach((node) => {
      if (node.type !== 'group') return
      const mapping = groupInputLookup[node.id] || {}
      Object.entries(mapping).forEach(([internalPort, groupPortId]) => {
        const inbound = circuit.wires.find((w) => w.target === groupPortId)
        const next = inbound ? (outputs[inbound.source] ?? false) : false
        if (outputs[internalPort] !== next) {
          outputs[internalPort] = next
          changed = true
        }
      })
    })

    for (const node of circuit.nodes) {
      if (node.type === 'gate') {
        const inputs = node.data.inputPortIds.map((portId) =>
          resolvePortValue(portId, circuit.wires, outputs, groupInputLookup),
        )
        const next = evaluateGate(node.data.gateType, inputs)
        const outId = node.data.outputPortId
        if (outputs[outId] !== next) {
          outputs[outId] = next
          changed = true
        }
      }
      if (node.type === 'junction') {
        const next = resolvePortValue(node.data.inputPortId, circuit.wires, outputs, groupInputLookup)
        const outId = node.data.outputPortId
        if (outputs[outId] !== next) {
          outputs[outId] = next
          changed = true
        }
      }
    }

    // propagate group outputs based on internal outputs
    circuit.nodes.forEach((node) => {
      if (node.type !== 'group') return
      const mapping = groupOutputLookup[node.id] || {}
      Object.entries(mapping).forEach(([groupPort, internalPort]) => {
        const internalKind = portKindById[internalPort]
        const next =
          internalKind === 'input'
            ? resolvePortValue(internalPort, circuit.wires, outputs, groupInputLookup)
            : (outputs[internalPort] ?? false)
        if (outputs[groupPort] !== next) {
          outputs[groupPort] = next
          changed = true
        }
      })
    })
  }

  // Resolve light inputs
  circuit.nodes.forEach((node) => {
    if (node.type === 'light') {
      const val = resolvePortValue(node.data.inputPortId, circuit.wires, outputs, groupInputLookup)
      lights[node.id] = val
    }
  })

  const converged = !changed && iterations <= MAX_ITERATIONS
  if (!converged && iterations >= MAX_ITERATIONS) {
    errors.push('Simulation did not converge within iteration cap')
  }

  return { outputs, lights, iterations, converged, errors: errors.length ? errors : undefined }
}

function resolvePortValue(
  portId: string,
  wires: Wire[],
  outputs: Record<string, boolean>,
  groupInputs: Record<string, Record<string, string>>,
): boolean {
  const groupInput = findInboundGroupPortId(groupInputs, portId)
  if (groupInput) {
    const inbound = wires.find((w) => w.target === groupInput)
    if (!inbound) return false
    return outputs[inbound.source] ?? false
  }
  const inbound = wires.find((w) => w.target === portId)
  if (!inbound) return false
  return outputs[inbound.source] ?? false
}

function evaluateGate(type: GateType, inputs: boolean[]): boolean {
  switch (type) {
    case 'AND':
      return inputs.every(Boolean)
    case 'OR':
      return inputs.some(Boolean)
    case 'NOT':
      return !inputs[0]
    case 'NAND':
      return !inputs.every(Boolean)
    case 'NOR':
      return !inputs.some(Boolean)
    case 'XOR':
      return inputs.reduce((acc, val) => acc + (val ? 1 : 0), 0) % 2 === 1
    case 'XNOR':
      return inputs.reduce((acc, val) => acc + (val ? 1 : 0), 0) % 2 === 0
    default:
      return false
  }
}

function buildGroupInputLookup(circuit: Circuit, portKindById: Record<string, PortKind | undefined>) {
  const lookup: Record<string, Record<string, string>> = {}
  circuit.nodes.forEach((node) => {
    if (node.type === 'group') {
      Object.entries(node.data.portMap.inputs).forEach(([groupPortId, internalPort]) => {
        const internalKind = portKindById[internalPort]
        // For legacy groups (internalKind === 'input'), resolvePortValue needs to understand the indirection.
        // For v1.2 groups (internalKind === 'output'), we eagerly propagate above so internal consumers can read it as an output.
        if (internalKind !== 'output') {
          lookup[internalPort] = { [internalPort]: groupPortId }
        } else {
          if (!lookup[node.id]) lookup[node.id] = {}
          lookup[node.id][internalPort] = groupPortId
        }
      })
    }
  })
  return lookup
}

function buildGroupOutputLookup(circuit: Circuit) {
  const lookup: Record<string, Record<string, string>> = {}
  circuit.nodes.forEach((node) => {
    if (node.type === 'group') {
      lookup[node.id] = { ...node.data.portMap.outputs }
    }
  })
  return lookup
}

function buildPortKindLookup(circuit: Circuit): Record<string, PortKind> {
  const lookup: Record<string, PortKind> = {}
  circuit.nodes.forEach((node: CircuitNode) => {
    switch (node.type) {
      case 'switch':
        lookup[node.data.outputPortId] = 'output'
        break
      case 'light':
        lookup[node.data.inputPortId] = 'input'
        break
      case 'gate':
        node.data.inputPortIds.forEach((id) => (lookup[id] = 'input'))
        lookup[node.data.outputPortId] = 'output'
        break
      case 'junction':
        lookup[node.data.inputPortId] = 'input'
        lookup[node.data.outputPortId] = 'output'
        break
      case 'group':
        node.data.interface.inputs.forEach((p) => (lookup[p.id] = 'input'))
        node.data.interface.outputs.forEach((p) => (lookup[p.id] = 'output'))
        break
    }
  })
  return lookup
}

function findInboundGroupPortId(groupInputs: Record<string, Record<string, string>>, internalPortId: string) {
  // legacy shape: keyed by internalPortId
  const legacy = groupInputs[internalPortId]
  if (legacy && legacy[internalPortId]) return legacy[internalPortId]

  // v1.2 propagation shape: keyed by groupId, mapping internalOutputPortId -> groupInputPortId
  for (const mapping of Object.values(groupInputs)) {
    if (mapping && mapping[internalPortId]) return mapping[internalPortId]
  }
  return null
}
