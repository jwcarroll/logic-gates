import type { Circuit, GateType, SimulationResult, Wire } from './types'

const MAX_ITERATIONS = 100

export function simulate(circuit: Circuit): SimulationResult {
  const outputs: Record<string, boolean> = {}
  const lights: Record<string, boolean> = {}

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
        const inputs = node.data.inputPortIds.map((portId) => resolvePortValue(portId, circuit.wires, outputs))
        const next = evaluateGate(node.data.gateType, inputs)
        const outId = node.data.outputPortId
        if (outputs[outId] !== next) {
          outputs[outId] = next
          changed = true
        }
      }
      // groups are omitted in this scaffold; they will be added later
    }
  }

  // Resolve light inputs
  circuit.nodes.forEach((node) => {
    if (node.type === 'light') {
      const val = resolvePortValue(node.data.inputPortId, circuit.wires, outputs)
      lights[node.id] = val
    }
  })

  return { outputs, lights }
}

function resolvePortValue(portId: string, wires: Wire[], outputs: Record<string, boolean>): boolean {
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
