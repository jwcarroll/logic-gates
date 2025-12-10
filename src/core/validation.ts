import type { Circuit, CircuitNode, Port, Result, Wire } from './types'

function findPort(node: CircuitNode, portId: string): Port | null {
  switch (node.type) {
    case 'switch':
      return node.data.outputPortId === portId
        ? { id: portId, nodeId: node.id, kind: 'output', index: 0 }
        : null
    case 'light':
      return node.data.inputPortId === portId
        ? { id: portId, nodeId: node.id, kind: 'input', index: 0 }
        : null
    case 'gate': {
      if (node.data.outputPortId === portId) {
        return { id: portId, nodeId: node.id, kind: 'output', index: 0 }
      }
      const idx = node.data.inputPortIds.indexOf(portId)
      if (idx >= 0) {
        return { id: portId, nodeId: node.id, kind: 'input', index: idx }
      }
      return null
    }
    case 'group': {
      if (node.data.outputPortIds.includes(portId)) {
        return { id: portId, nodeId: node.id, kind: 'output', index: node.data.outputPortIds.indexOf(portId) }
      }
      if (node.data.inputPortIds.includes(portId)) {
        return { id: portId, nodeId: node.id, kind: 'input', index: node.data.inputPortIds.indexOf(portId) }
      }
      return null
    }
    default:
      return null
  }
}

export function validateWire(circuit: Circuit, wire: Wire): Result<Wire> {
  const errors: string[] = []

  const sourceNode = circuit.nodes.find((n) => n.id === wire.sourceNode)
  const targetNode = circuit.nodes.find((n) => n.id === wire.targetNode)
  if (!sourceNode || !targetNode) {
    errors.push('Source or target node missing')
  }

  const sourcePort = sourceNode ? findPort(sourceNode, wire.source) : null
  const targetPort = targetNode ? findPort(targetNode, wire.target) : null

  if (!sourcePort || !targetPort) {
    errors.push('Source or target port missing')
  }

  if (sourcePort && sourcePort.kind !== 'output') {
    errors.push('Wire source must be an output port')
  }
  if (targetPort && targetPort.kind !== 'input') {
    errors.push('Wire target must be an input port')
  }
  if (wire.sourceNode === wire.targetNode) {
    errors.push('Self-loops are not allowed')
  }
  const targetAlreadyUsed = circuit.wires.some((w) => w.target === wire.target)
  if (targetAlreadyUsed) {
    errors.push('Input already connected')
  }

  if (errors.length) {
    return { ok: false, errors }
  }

  return { ok: true, value: wire }
}
