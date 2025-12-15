import type { Edge, Node } from 'reactflow'
import type { Circuit, CircuitNode } from '../core/types'

type LogicNodeData = {
  label: string
  meta?: string
  inputs: string[]
  outputs: string[]
  kind: CircuitNode['type']
  gateType?: string
  switchState?: boolean
  lightState?: boolean
  portLabels?: Record<string, string>
  inputStates: Record<string, boolean | undefined>
  outputStates: Record<string, boolean | undefined>
  onToggle?: () => void
}

export function toReactFlowNodes(
  circuit: Circuit,
  outputs: Record<string, boolean>,
  lights: Record<string, boolean>,
  handlers: { onToggleSwitch: (nodeId: string) => void },
  view?: { groupId?: string | null },
): Node<LogicNodeData>[] {
  return circuit.nodes
    .filter((node) => {
      const groupId = view?.groupId ?? null
      if (groupId) return node.groupId === groupId
      return !node.groupId
    }) // root hides children inside groups; group view shows children for that group
    .map((node) => ({
      id: node.id,
      type: 'logicNode',
      position: node.position,
      data: toLogicNodeData(node, outputs, lights, handlers),
      width: node.width,
      height: node.height,
      selectable: node.type !== 'junction',
    }))
}

export function toReactFlowEdges(circuit: Circuit, view?: { groupId?: string | null }): Edge[] {
  const nodeById = new Map(circuit.nodes.map((n) => [n.id, n]))
  const groupId = view?.groupId ?? null
  return circuit.wires
    .filter((wire) => {
      const sourceNode = nodeById.get(wire.sourceNode)
      const targetNode = nodeById.get(wire.targetNode)
      if (groupId) {
        return sourceNode?.groupId === groupId && targetNode?.groupId === groupId
      }
      return !(sourceNode?.groupId || targetNode?.groupId)
    })
    .map((wire) => ({
      id: wire.id,
      source: wire.sourceNode,
      target: wire.targetNode,
      sourceHandle: wire.source,
      targetHandle: wire.target,
    }))
}

function toLogicNodeData(
  node: CircuitNode,
  outputs: Record<string, boolean>,
  lights: Record<string, boolean>,
  handlers: { onToggleSwitch: (nodeId: string) => void },
): LogicNodeData {
  switch (node.type) {
    case 'switch':
      return {
        label: node.data.label ?? 'Switch',
        kind: 'switch',
        inputs: [],
        outputs: [node.data.outputPortId],
        outputStates: { [node.data.outputPortId]: outputs[node.data.outputPortId] },
        inputStates: {},
        switchState: node.data.state,
        onToggle: () => handlers.onToggleSwitch(node.id),
      }
    case 'light':
      return {
        label: 'Light',
        kind: 'light',
        inputs: [node.data.inputPortId],
        outputs: [],
        outputStates: {},
        inputStates: { [node.data.inputPortId]: resolveState(node.data.inputPortId, outputs) },
        lightState: lights[node.id] ?? resolveState(node.data.inputPortId, outputs),
      }
    case 'gate':
      return {
        label: `${node.data.gateType} gate`,
        meta: node.data.gateType,
        kind: 'gate',
        gateType: node.data.gateType,
        inputs: node.data.inputPortIds,
        outputs: [node.data.outputPortId],
        inputStates: toStateMap(node.data.inputPortIds, outputs),
        outputStates: { [node.data.outputPortId]: outputs[node.data.outputPortId] },
      }
    case 'group':
      return {
        label: node.data.label,
        meta: node.data.collapsed ? 'Collapsed' : 'Expanded',
        kind: 'group',
        inputs: node.data.interface.inputs.map((p) => p.id),
        outputs: node.data.interface.outputs.map((p) => p.id),
        portLabels: Object.fromEntries([...node.data.interface.inputs, ...node.data.interface.outputs].map((p) => [p.id, p.name])),
        inputStates: toStateMap(node.data.interface.inputs.map((p) => p.id), outputs),
        outputStates: toStateMap(node.data.interface.outputs.map((p) => p.id), outputs),
      }
    case 'junction':
      return {
        label: node.data.label ?? 'Junction',
        kind: 'junction',
        inputs: [node.data.inputPortId],
        outputs: [node.data.outputPortId],
        inputStates: { [node.data.inputPortId]: resolveState(node.data.inputPortId, outputs) },
        outputStates: { [node.data.outputPortId]: outputs[node.data.outputPortId] },
      }
    default:
      return {
        label: 'Node',
        inputs: [],
        outputs: [],
        kind: 'gate',
        inputStates: {},
        outputStates: {},
      }
  }
}

function toStateMap(ids: string[], outputs: Record<string, boolean>) {
  return ids.reduce<Record<string, boolean | undefined>>((acc, id) => {
    acc[id] = outputs[id]
    return acc
  }, {})
}

function resolveState(portId: string, outputs: Record<string, boolean>) {
  return outputs[portId]
}
