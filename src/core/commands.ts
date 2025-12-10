import { makeId } from './ids'
import type { Circuit, CircuitNode, GateNode, GroupNode, Position, Result, Wire } from './types'
import { validateWire } from './validation'

export interface ConnectInput {
  sourceNodeId: string
  targetNodeId: string
  sourcePortId: string
  targetPortId: string
}

export function addNode<T extends CircuitNode>(circuit: Circuit, node: T): Result<Circuit> {
  return { ok: true, value: { ...circuit, nodes: [...circuit.nodes, node] } }
}

export function removeNode(circuit: Circuit, nodeId: string): Result<Circuit> {
  const nodes = circuit.nodes.filter((n) => n.id !== nodeId)
  const wires = circuit.wires.filter((w) => w.sourceNode !== nodeId && w.targetNode !== nodeId)
  return { ok: true, value: { ...circuit, nodes, wires } }
}

export function moveNode(circuit: Circuit, nodeId: string, delta: Position): Result<Circuit> {
  const nodes = circuit.nodes.map((n) =>
    n.id === nodeId ? { ...n, position: { x: n.position.x + delta.x, y: n.position.y + delta.y } } : n,
  )
  return { ok: true, value: { ...circuit, nodes } }
}

export function connect(circuit: Circuit, input: ConnectInput): Result<Circuit> {
  const wire: Wire = {
    id: makeId('wire'),
    source: input.sourcePortId,
    target: input.targetPortId,
    sourceNode: input.sourceNodeId,
    targetNode: input.targetNodeId,
  }
  const validation = validateWire(circuit, wire)
  if (!validation.ok) return { ok: false, errors: validation.errors }
  return { ok: true, value: { ...circuit, wires: [...circuit.wires, wire] } }
}

export function disconnect(circuit: Circuit, wireId: string): Result<Circuit> {
  const wires = circuit.wires.filter((w) => w.id !== wireId)
  return { ok: true, value: { ...circuit, wires } }
}

interface GroupInput {
  nodeIds: string[]
  label: string
  collapsed?: boolean
}

export function groupNodes(circuit: Circuit, input: GroupInput): Result<Circuit> {
  if (!input.nodeIds.length) {
    return { ok: false, errors: ['No nodes selected to group'] }
  }
  const selectedIds = new Set(input.nodeIds)
  const selectedNodes = circuit.nodes.filter((node) => selectedIds.has(node.id))
  if (selectedNodes.length !== input.nodeIds.length) {
    return { ok: false, errors: ['One or more selected nodes are missing'] }
  }

  const groupId = makeId('group')
  const { inputPortIds, outputPortIds, portMap, rewiredWires } = buildGroupPortsAndRewire(
    groupId,
    selectedNodes,
    selectedIds,
    circuit.wires,
  )
  const bounds = computeBounds(selectedNodes)
  const groupNode: GroupNode = {
    id: groupId,
    type: 'group',
    position: bounds.position,
    width: bounds.width,
    height: bounds.height,
    data: {
      label: input.label,
      childNodeIds: [...input.nodeIds],
      inputPortIds,
      outputPortIds,
      collapsed: input.collapsed ?? false,
      portMap,
    },
  }

  const nodes = circuit.nodes.map((node) => (selectedIds.has(node.id) ? { ...node, groupId } : node))
  return { ok: true, value: { ...circuit, nodes: [...nodes, groupNode], wires: rewiredWires } }
}

export function ungroup(circuit: Circuit, groupId: string): Result<Circuit> {
  const group = circuit.nodes.find((node) => node.type === 'group' && node.id === groupId) as GroupNode | undefined
  if (!group) return { ok: false, errors: ['Group not found'] }
  const childIds = new Set(group.data.childNodeIds)
  const childNodes = circuit.nodes.filter((n) => childIds.has(n.id))
  const portToNode = new Map<string, string>()
  childNodes.forEach((node) => {
    getInputPorts(node).forEach((p) => portToNode.set(p, node.id))
    getOutputPorts(node).forEach((p) => portToNode.set(p, node.id))
  })

  const rewiredWires: Wire[] = circuit.wires
    .map((wire) => {
      if (wire.sourceNode === groupId) {
        const internalPort = group.data.portMap.outputs[wire.source]
        if (!internalPort) return null
        const nodeId = portToNode.get(internalPort)
        if (!nodeId) return null
        return { ...wire, source: internalPort, sourceNode: nodeId }
      }
      if (wire.targetNode === groupId) {
        const internalPort = group.data.portMap.inputs[wire.target]
        if (!internalPort) return null
        const nodeId = portToNode.get(internalPort)
        if (!nodeId) return null
        return { ...wire, target: internalPort, targetNode: nodeId }
      }
      return wire
    })
    .filter((w): w is Wire => Boolean(w))

  const nodes = circuit.nodes
    .filter((node) => node.id !== groupId)
    .map((node) => (node.groupId === groupId ? { ...node, groupId: undefined } : node))
  return { ok: true, value: { ...circuit, nodes, wires: rewiredWires } }
}

export function cloneGroup(circuit: Circuit, groupId: string, offset: Position = { x: 30, y: 30 }): Result<Circuit> {
  const group = circuit.nodes.find((n) => n.type === 'group' && n.id === groupId) as GroupNode | undefined
  if (!group) return { ok: false, errors: ['Group not found'] }

  const childIds = new Set(group.data.childNodeIds)
  const childNodes = circuit.nodes.filter((n) => childIds.has(n.id))
  if (!childNodes.length) return { ok: false, errors: ['Group has no child nodes to clone'] }

  const nodeIdMap = new Map<string, string>()
  const portIdMap = new Map<string, string>()
  const clonedNodes: CircuitNode[] = childNodes.map((node) => cloneNode(node, offset, nodeIdMap, portIdMap))

  const internalWires = circuit.wires.filter((wire) => childIds.has(wire.sourceNode) && childIds.has(wire.targetNode))
  const clonedWires: Wire[] = internalWires.map((wire) => ({
    id: makeId('wire'),
    source: portIdMap.get(wire.source) ?? wire.source,
    target: portIdMap.get(wire.target) ?? wire.target,
    sourceNode: nodeIdMap.get(wire.sourceNode) ?? wire.sourceNode,
    targetNode: nodeIdMap.get(wire.targetNode) ?? wire.targetNode,
  }))

  const { inputPortIds, outputPortIds, portMap } = rebuildPortMap(group, portIdMap)
  const bounds = computeBounds(clonedNodes)
  const clonedGroup: GroupNode = {
    id: makeId('group'),
    type: 'group',
    position: { x: group.position.x + offset.x, y: group.position.y + offset.y },
    width: bounds.width,
    height: bounds.height,
    data: {
      label: group.data.label,
      childNodeIds: clonedNodes.map((n) => n.id),
      inputPortIds,
      outputPortIds,
      collapsed: group.data.collapsed,
      portMap,
    },
  }

  const nodesWithGroup = clonedNodes.map((node) => ({ ...node, groupId: clonedGroup.id }))

  return {
    ok: true,
    value: {
      ...circuit,
      nodes: [...circuit.nodes, ...nodesWithGroup, clonedGroup],
      wires: [...circuit.wires, ...clonedWires],
    },
  }
}

function buildGroupPortsAndRewire(
  groupId: string,
  nodes: CircuitNode[],
  selectedIds: Set<string>,
  wires: Wire[],
) {
  const inputPortIds: string[] = []
  const outputPortIds: string[] = []
  const portMap = { inputs: {} as Record<string, string>, outputs: {} as Record<string, string> }
  const exposedInputs = new Map<string, string>() // internal -> group port
  const exposedOutputs = new Map<string, string>() // internal -> group port

  const rewired = wires.map((wire) => {
    const sourceInside = selectedIds.has(wire.sourceNode)
    const targetInside = selectedIds.has(wire.targetNode)

    // outbound from group to outside
    if (sourceInside && !targetInside) {
      let groupPort = exposedOutputs.get(wire.source)
      if (!groupPort) {
        groupPort = makeId('group-out')
        exposedOutputs.set(wire.source, groupPort)
        outputPortIds.push(groupPort)
        portMap.outputs[groupPort] = wire.source
      }
      return { ...wire, source: groupPort, sourceNode: groupId }
    }

    // inbound to group from outside
    if (!sourceInside && targetInside) {
      let groupPort = exposedInputs.get(wire.target)
      if (!groupPort) {
        groupPort = makeId('group-in')
        exposedInputs.set(wire.target, groupPort)
        inputPortIds.push(groupPort)
        portMap.inputs[groupPort] = wire.target
      }
      return { ...wire, target: groupPort, targetNode: groupId }
    }

    // internal wires stay as-is; completely external untouched
    return wire
  })

  // expose any unconnected ports for reuse (no external wire) so the group can act as a template
  nodes.forEach((node) => {
    getInputPorts(node).forEach((portId) => {
      if (exposedInputs.has(portId)) return
      const hasInbound = wires.some((wire) => wire.target === portId)
      if (!hasInbound) {
        const groupPort = makeId('group-in')
        exposedInputs.set(portId, groupPort)
        inputPortIds.push(groupPort)
        portMap.inputs[groupPort] = portId
      }
    })
    getOutputPorts(node).forEach((portId) => {
      if (exposedOutputs.has(portId)) return
      const outbound = wires.filter((wire) => wire.source === portId)
      const hasOutsideTarget = outbound.some((wire) => !selectedIds.has(wire.targetNode))
      if (!outbound.length || hasOutsideTarget) {
        const groupPort = makeId('group-out')
        exposedOutputs.set(portId, groupPort)
        outputPortIds.push(groupPort)
        portMap.outputs[groupPort] = portId
      }
    })
  })

  return { inputPortIds, outputPortIds, portMap, rewiredWires: rewired }
}

function computeBounds(nodes: CircuitNode[]) {
  if (!nodes.length) {
    return { position: { x: 0, y: 0 }, width: 160, height: 120 }
  }
  const padding = 40
  const minX = Math.min(...nodes.map((n) => n.position.x))
  const minY = Math.min(...nodes.map((n) => n.position.y))
  const maxX = Math.max(...nodes.map((n) => n.position.x + n.width))
  const maxY = Math.max(...nodes.map((n) => n.position.y + n.height))
  return {
    position: { x: minX - padding / 2, y: minY - padding / 2 },
    width: maxX - minX + padding,
    height: maxY - minY + padding,
  }
}

function getInputPorts(node: CircuitNode): string[] {
  switch (node.type) {
    case 'light':
      return [node.data.inputPortId]
    case 'gate':
      return [...node.data.inputPortIds]
    case 'group':
      return [...node.data.inputPortIds]
    default:
      return []
  }
}

function getOutputPorts(node: CircuitNode): string[] {
  switch (node.type) {
    case 'switch':
      return [node.data.outputPortId]
    case 'gate':
      return [node.data.outputPortId]
    case 'group':
      return [...node.data.outputPortIds]
    default:
      return []
  }
}

function cloneNode(
  node: CircuitNode,
  offset: Position,
  nodeIdMap: Map<string, string>,
  portIdMap: Map<string, string>,
): CircuitNode {
  switch (node.type) {
    case 'switch': {
      const id = makeId('switch')
      nodeIdMap.set(node.id, id)
      const outputPortId = makeId('port')
      portIdMap.set(node.data.outputPortId, outputPortId)
      return {
        ...node,
        id,
        position: offsetPosition(node.position, offset),
        data: { ...node.data, outputPortId },
      }
    }
    case 'light': {
      const id = makeId('light')
      nodeIdMap.set(node.id, id)
      const inputPortId = makeId('port')
      portIdMap.set(node.data.inputPortId, inputPortId)
      return {
        ...node,
        id,
        position: offsetPosition(node.position, offset),
        data: { ...node.data, inputPortId },
      }
    }
    case 'gate': {
      const id = makeId('gate')
      nodeIdMap.set(node.id, id)
      const inputPortIds = node.data.inputPortIds.map((p) => {
        const next = makeId('port')
        portIdMap.set(p, next)
        return next
      })
      const outputPortId = makeId('port')
      portIdMap.set(node.data.outputPortId, outputPortId)
      return {
        ...node,
        id,
        position: offsetPosition(node.position, offset),
        data: { ...node.data, inputPortIds, outputPortId },
      } as GateNode
    }
    case 'group': {
      // Nested groups are not cloned in this pass; return the original reference.
      nodeIdMap.set(node.id, node.id)
      return node
    }
    default:
      return node
  }
}

function rebuildPortMap(group: GroupNode, portIdMap: Map<string, string>) {
  const inputs: Record<string, string> = {}
  const outputs: Record<string, string> = {}
  const inputPortIds: string[] = []
  const outputPortIds: string[] = []

  Object.entries(group.data.portMap.inputs).forEach(([, internalPort]) => {
    const mapped = portIdMap.get(internalPort)
    if (mapped) {
      const groupPort = makeId('group-in')
      inputs[groupPort] = mapped
      inputPortIds.push(groupPort)
    }
  })
  Object.entries(group.data.portMap.outputs).forEach(([, internalPort]) => {
    const mapped = portIdMap.get(internalPort)
    if (mapped) {
      const groupPort = makeId('group-out')
      outputs[groupPort] = mapped
      outputPortIds.push(groupPort)
    }
  })

  return { inputPortIds, outputPortIds, portMap: { inputs, outputs } }
}

function offsetPosition(position: Position, offset: Position): Position {
  return { x: position.x + offset.x, y: position.y + offset.y }
}
