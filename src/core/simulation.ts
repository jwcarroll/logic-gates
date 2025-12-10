import type { Circuit, GateType, SimulationResult, Wire } from './types'

const MAX_ITERATIONS = 100

export function simulate(circuit: Circuit): SimulationResult {
  const outputs: Record<string, boolean> = {}
  const lights: Record<string, boolean> = {}
  const errors: string[] = []
  const groupInputLookup = buildGroupInputLookup(circuit)
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
    }

    // propagate group outputs based on internal outputs
    circuit.nodes.forEach((node) => {
      if (node.type !== 'group') return
      const mapping = groupOutputLookup[node.id] || {}
      Object.entries(mapping).forEach(([groupPort, internalPort]) => {
        const next = outputs[internalPort] ?? false
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
  groupInputs: Record<string, { groupId: string; groupPortId: string }>,
): boolean {
  const groupInput = groupInputs[portId]
  if (groupInput) {
    const inbound = wires.find((w) => w.target === groupInput.groupPortId)
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

function buildGroupInputLookup(circuit: Circuit) {
  const lookup: Record<string, { groupId: string; groupPortId: string }> = {}
  circuit.nodes.forEach((node) => {
    if (node.type === 'group') {
      Object.entries(node.data.portMap.inputs).forEach(([groupPortId, internalPort]) => {
        lookup[internalPort] = { groupId: node.id, groupPortId }
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
