import type { Connection } from 'reactflow'
import { makeId } from './ids'
import type { Circuit, CircuitNode, PortKind } from './types'

interface CommandResult<T> {
  ok: boolean
  next: T
  error?: string
}

export function addWire(circuit: Circuit, connection: Connection): CommandResult<Circuit> {
  const sourcePortId = connection.sourceHandle ?? connection.source
  const targetPortId = connection.targetHandle ?? connection.target

  if (!sourcePortId || !targetPortId || !connection.source || !connection.target) {
    return { ok: false, next: circuit, error: 'Missing connection endpoints' }
  }

  const sourceNode = findNode(circuit, connection.source)
  const targetNode = findNode(circuit, connection.target)
  if (!sourceNode || !targetNode) {
    return { ok: false, next: circuit, error: 'Node not found for connection' }
  }

  const sourceKind = resolvePortKind(sourceNode, sourcePortId)
  const targetKind = resolvePortKind(targetNode, targetPortId)
  if (sourceKind !== 'output' || targetKind !== 'input') {
    return { ok: false, next: circuit, error: 'Connections must be output → input' }
  }

  const inputAlreadyUsed = circuit.wires.some((w) => w.target === targetPortId)
  if (inputAlreadyUsed) {
    return { ok: false, next: circuit, error: 'Input already connected' }
  }

  const wire = {
    id: makeId('wire'),
    source: sourcePortId,
    target: targetPortId,
    sourceNode: sourceNode.id,
    targetNode: targetNode.id,
  }

  return {
    ok: true,
    next: {
      ...circuit,
      wires: [...circuit.wires, wire],
    },
  }
}

function findNode(circuit: Circuit, nodeId: string): CircuitNode | undefined {
  return circuit.nodes.find((n) => n.id === nodeId)
}

function resolvePortKind(node: CircuitNode, portId: string): PortKind | null {
  switch (node.type) {
    case 'switch':
      return node.data.outputPortId === portId ? 'output' : null
    case 'light':
      return node.data.inputPortId === portId ? 'input' : null
    case 'gate':
      if (node.data.outputPortId === portId) return 'output'
      if (node.data.inputPortIds.includes(portId)) return 'input'
      return null
    case 'group':
      if (node.data.outputPortIds.includes(portId)) return 'output'
      if (node.data.inputPortIds.includes(portId)) return 'input'
      return null
    default:
      return null
  }
}
