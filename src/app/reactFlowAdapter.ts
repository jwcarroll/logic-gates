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
  inputStates: Record<string, boolean | undefined>
  outputStates: Record<string, boolean | undefined>
  onToggle?: () => void
}

export function toReactFlowNodes(
  circuit: Circuit,
  outputs: Record<string, boolean>,
  lights: Record<string, boolean>,
  handlers: { onToggleSwitch: (nodeId: string) => void },
): Node<LogicNodeData>[] {
  return circuit.nodes
    .filter((node) => !node.groupId) // hide children inside groups; render group node instead
    .map((node) => ({
      id: node.id,
      type: 'logicNode',
      position: node.position,
      data: toLogicNodeData(node, outputs, lights, handlers),
      width: node.width,
      height: node.height,
      selectable: true,
    }))
}

export function toReactFlowEdges(circuit: Circuit): Edge[] {
  return circuit.wires
    .filter((wire) => {
      const sourceNode = circuit.nodes.find((n) => n.id === wire.sourceNode)
      const targetNode = circuit.nodes.find((n) => n.id === wire.targetNode)
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
        inputs: node.data.inputPortIds,
        outputs: node.data.outputPortIds,
        inputStates: toStateMap(node.data.inputPortIds, outputs),
        outputStates: toStateMap(node.data.outputPortIds, outputs),
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
