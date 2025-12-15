import { makeId } from './ids'
import type { Circuit, CircuitNode, ExposedPort, GateNode, GroupInterface, GroupNode, Position, Result, Wire } from './types'
import { createJunctionNode } from './factories'
import { buildGroupPortMap, validateGroupInterface } from './groupInterfaceValidation'
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

interface CreateGroupInput {
  nodeIds: string[]
  label: string
  collapsed?: boolean
  interfaceDraft: GroupInterface
}

export function createGroup(circuit: Circuit, input: CreateGroupInput): Result<Circuit> {
  if (!input.nodeIds.length) return { ok: false, errors: ['No nodes selected to group'] }

  const selectedIds = new Set(input.nodeIds)
  const selectedNodes = circuit.nodes.filter((node) => selectedIds.has(node.id))
  if (selectedNodes.length !== input.nodeIds.length) {
    return { ok: false, errors: ['One or more selected nodes are missing'] }
  }

  const draftErrors = validateInterfaceDraft(input.interfaceDraft, selectedNodes)
  if (draftErrors.length) return { ok: false, errors: draftErrors }

  const groupId = makeId('group')
  const bounds = computeBounds(selectedNodes)

  // Map internal port id -> owning node id for selected nodes
  const portToNode = new Map<string, string>()
  selectedNodes.forEach((node) => {
    getInputPorts(node).forEach((p) => portToNode.set(p, node.id))
    getOutputPorts(node).forEach((p) => portToNode.set(p, node.id))
  })

  const inputJunctions = input.interfaceDraft.inputs.map((p, idx) => ({
    draft: p,
    node: createJunctionNode(
      {
        x: bounds.position.x + 10,
        y: bounds.position.y + 40 + idx * 60,
      },
      { label: p.name },
    ),
  }))
  const outputJunctions = input.interfaceDraft.outputs.map((p, idx) => ({
    draft: p,
    node: createJunctionNode(
      {
        x: bounds.position.x + bounds.width - 70,
        y: bounds.position.y + 40 + idx * 60,
      },
      { label: p.name },
    ),
  }))

  const groupInterface: GroupInterface = {
    inputs: inputJunctions.map(({ draft, node }) => ({
      id: draft.id,
      kind: 'input',
      name: draft.name,
      mapsToInternalPortId: node.data.outputPortId, // FR-006a
    })),
    outputs: outputJunctions.map(({ draft, node }) => ({
      id: draft.id,
      kind: 'output',
      name: draft.name,
      mapsToInternalPortId: node.data.inputPortId, // FR-006a
    })),
  }

  const portMap = {
    inputs: Object.fromEntries(groupInterface.inputs.map((p) => [p.id, p.mapsToInternalPortId])),
    outputs: Object.fromEntries(groupInterface.outputs.map((p) => [p.id, p.mapsToInternalPortId])),
  }

  // Rewire or drop boundary wires based on interfaceDraft selections
  const inputSourceToGroupPortId = new Map<string, string>()
  const inputPortFanoutTargets = new Map<string, Set<string>>() // groupInputPortId -> internal target port ids

  inputJunctions.forEach(({ draft }) => {
    const seed = circuit.wires.find((w) => !selectedIds.has(w.sourceNode) && selectedIds.has(w.targetNode) && w.target === draft.mapsToInternalPortId)
    if (!seed) {
      inputPortFanoutTargets.set(draft.id, new Set([draft.mapsToInternalPortId]))
      return
    }
    inputSourceToGroupPortId.set(seed.source, draft.id)
    const targets = new Set(
      circuit.wires
        .filter((w) => !selectedIds.has(w.sourceNode) && selectedIds.has(w.targetNode) && w.source === seed.source)
        .map((w) => w.target),
    )
    targets.add(draft.mapsToInternalPortId)
    inputPortFanoutTargets.set(draft.id, targets)
  })

  const seenInboundGroupPortTargets = new Set<string>()
  const rewiredWires: Wire[] = circuit.wires
    .map((wire) => {
      const sourceInside = selectedIds.has(wire.sourceNode)
      const targetInside = selectedIds.has(wire.targetNode)

      if (sourceInside && !targetInside) {
        const matching = input.interfaceDraft.outputs.find((p) => p.mapsToInternalPortId === wire.source)
        if (!matching) return null
        return { ...wire, source: matching.id, sourceNode: groupId }
      }
      if (!sourceInside && targetInside) {
        const groupPortId = inputSourceToGroupPortId.get(wire.source) ?? input.interfaceDraft.inputs.find((p) => p.mapsToInternalPortId === wire.target)?.id
        if (!groupPortId) return null
        if (seenInboundGroupPortTargets.has(groupPortId)) return null
        seenInboundGroupPortTargets.add(groupPortId)
        return { ...wire, target: groupPortId, targetNode: groupId }
      }
      return wire
    })
    .filter((w): w is Wire => Boolean(w))

  // Add internal wires to connect junctions to the selected internal ports.
  const internalWires: Wire[] = []
  inputJunctions.forEach(({ draft, node }) => {
    const targets = inputPortFanoutTargets.get(draft.id) ?? new Set([draft.mapsToInternalPortId])
    targets.forEach((targetPortId) => {
      const targetNodeId = portToNode.get(targetPortId)
      if (!targetNodeId) return
      internalWires.push({
        id: makeId('wire'),
        source: node.data.outputPortId,
        sourceNode: node.id,
        target: targetPortId,
        targetNode: targetNodeId,
      })
    })
  })
  outputJunctions.forEach(({ draft, node }) => {
    const sourceNodeId = portToNode.get(draft.mapsToInternalPortId)
    if (!sourceNodeId) return
    internalWires.push({
      id: makeId('wire'),
      source: draft.mapsToInternalPortId,
      sourceNode: sourceNodeId,
      target: node.data.inputPortId,
      targetNode: node.id,
    })
  })

  const groupNode: GroupNode = {
    id: groupId,
    type: 'group',
    position: bounds.position,
    width: bounds.width,
    height: bounds.height,
    data: {
      label: input.label,
      childNodeIds: [...input.nodeIds, ...inputJunctions.map((j) => j.node.id), ...outputJunctions.map((j) => j.node.id)],
      collapsed: input.collapsed ?? false,
      interface: groupInterface,
      portMap,
    },
  }

  const nodes = circuit.nodes.map((node) => (selectedIds.has(node.id) ? { ...node, groupId } : node))
  const junctionNodes = [...inputJunctions.map((j) => ({ ...j.node, groupId })), ...outputJunctions.map((j) => ({ ...j.node, groupId }))]

  const nextCircuit: Circuit = {
    ...circuit,
    nodes: [...nodes, ...junctionNodes, groupNode],
    wires: [...rewiredWires, ...internalWires],
  }

  // Validate the newly added internal wires against graph rules.
  for (const wire of internalWires) {
    const validation = validateWire({ ...nextCircuit, wires: nextCircuit.wires.filter((w) => w.id !== wire.id) }, wire)
    if (!validation.ok) return { ok: false, errors: validation.errors }
  }

  return { ok: true, value: nextCircuit }
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
  const { groupInterface, portMap, rewiredWires } = buildGroupPortsAndRewire(
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
      collapsed: input.collapsed ?? false,
      interface: groupInterface,
      portMap,
    },
  }

  const nodes = circuit.nodes.map((node) => (selectedIds.has(node.id) ? { ...node, groupId } : node))
  return { ok: true, value: { ...circuit, nodes: [...nodes, groupNode], wires: rewiredWires } }
}

export function updateGroupInterface(
  circuit: Circuit,
  groupId: string,
  nextInterface: GroupInterface,
): Result<{ circuit: Circuit; disconnectedWireIds: string[] }> {
  const group = circuit.nodes.find((n) => n.type === 'group' && n.id === groupId) as GroupNode | undefined
  if (!group) return { ok: false, errors: ['Group not found'] }

  const validation = validateGroupInterface(nextInterface, { circuit, groupId, requireAtLeastOnePort: true })
  if (!validation.ok || !validation.value) return { ok: false, errors: validation.errors }

  const disconnectedWireIds = circuit.wires
    .filter((w) => w.sourceNode === groupId || w.targetNode === groupId)
    .map((w) => w.id)

  const wires = circuit.wires.filter((w) => w.sourceNode !== groupId && w.targetNode !== groupId)
  const portMap = buildGroupPortMap(nextInterface)
  const nodes = circuit.nodes.map((n) =>
    n.type === 'group' && n.id === groupId ? { ...n, data: { ...n.data, interface: nextInterface, portMap } } : n,
  )

  return { ok: true, value: { circuit: { ...circuit, nodes, wires }, disconnectedWireIds } }
}

function validateInterfaceDraft(draft: GroupInterface, selectedNodes: CircuitNode[]): string[] {
  const errors: string[] = []
  const allPorts = [...draft.inputs, ...draft.outputs]
  if (allPorts.length === 0) errors.push('Group interface must expose at least one port')

  const seenIds = new Set<string>()
  const seenInternal = new Set<string>()
  allPorts.forEach((p) => {
    if (!p.id) errors.push('Exposed port id is required')
    if (seenIds.has(p.id)) errors.push(`Duplicate exposed port id: ${p.id}`)
    seenIds.add(p.id)

    if (!p.name) errors.push(`Exposed port ${p.id || '<unknown>'} name is required`)
    if (!p.mapsToInternalPortId) errors.push(`Exposed port ${p.id || '<unknown>'} must map to an internal port`)
    if (seenInternal.has(p.mapsToInternalPortId)) errors.push(`Duplicate mapping to internal port: ${p.mapsToInternalPortId}`)
    seenInternal.add(p.mapsToInternalPortId)
  })

  const internalInputs = new Set<string>()
  const internalOutputs = new Set<string>()
  selectedNodes.forEach((node) => {
    getInputPorts(node).forEach((p) => internalInputs.add(p))
    getOutputPorts(node).forEach((p) => internalOutputs.add(p))
  })

  draft.inputs.forEach((p) => {
    if (!internalInputs.has(p.mapsToInternalPortId)) {
      errors.push(`Input port ${p.id} must map to an input port on a selected node`)
    }
  })
  draft.outputs.forEach((p) => {
    if (!internalOutputs.has(p.mapsToInternalPortId)) {
      errors.push(`Output port ${p.id} must map to an output port on a selected node`)
    }
  })

  return errors
}

export function ungroup(circuit: Circuit, groupId: string): Result<Circuit> {
  const group = circuit.nodes.find((node) => node.type === 'group' && node.id === groupId) as GroupNode | undefined
  if (!group) return { ok: false, errors: ['Group not found'] }
  const childIds = new Set(group.data.childNodeIds)
  const childNodes = circuit.nodes.filter((n) => childIds.has(n.id))
  const portToNode = new Map<string, string>()
  const junctionByOutputPortId = new Map<string, CircuitNode & { type: 'junction' }>()
  const junctionByInputPortId = new Map<string, CircuitNode & { type: 'junction' }>()

  childNodes.forEach((node) => {
    getInputPorts(node).forEach((p) => portToNode.set(p, node.id))
    getOutputPorts(node).forEach((p) => portToNode.set(p, node.id))
    if (node.type === 'junction') {
      junctionByOutputPortId.set(node.data.outputPortId, node)
      junctionByInputPortId.set(node.data.inputPortId, node)
    }
  })

  const rewiredWires: Wire[] = circuit.wires
    .map((wire) => {
      if (wire.sourceNode === groupId) {
        const internalPort = group.data.portMap.outputs[wire.source]
        if (!internalPort) return null
        const v1_2Junction = junctionByInputPortId.get(internalPort)
        if (v1_2Junction) {
          return { ...wire, source: v1_2Junction.data.outputPortId, sourceNode: v1_2Junction.id }
        }
        const nodeId = portToNode.get(internalPort)
        if (!nodeId) return null
        return { ...wire, source: internalPort, sourceNode: nodeId }
      }
      if (wire.targetNode === groupId) {
        const internalPort = group.data.portMap.inputs[wire.target]
        if (!internalPort) return null
        const v1_2Junction = junctionByOutputPortId.get(internalPort)
        if (v1_2Junction) {
          return { ...wire, target: v1_2Junction.data.inputPortId, targetNode: v1_2Junction.id }
        }
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

  const { interface: groupInterface, portMap } = rebuildPortMap(group, portIdMap)
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
      collapsed: group.data.collapsed,
      interface: groupInterface,
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
  const inputs: ExposedPort[] = []
  const outputs: ExposedPort[] = []
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
        outputs.push({ id: groupPort, kind: 'output', name: `Out ${outputs.length + 1}`, mapsToInternalPortId: wire.source })
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
        inputs.push({ id: groupPort, kind: 'input', name: `In ${inputs.length + 1}`, mapsToInternalPortId: wire.target })
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
        inputs.push({ id: groupPort, kind: 'input', name: `In ${inputs.length + 1}`, mapsToInternalPortId: portId })
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
        outputs.push({ id: groupPort, kind: 'output', name: `Out ${outputs.length + 1}`, mapsToInternalPortId: portId })
        portMap.outputs[groupPort] = portId
      }
    })
  })

  const groupInterface: GroupInterface = { inputs, outputs }
  return { groupInterface, portMap, rewiredWires: rewired }
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
      return node.data.interface.inputs.map((p) => p.id)
    case 'junction':
      return [node.data.inputPortId]
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
      return node.data.interface.outputs.map((p) => p.id)
    case 'junction':
      return [node.data.outputPortId]
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
    case 'junction': {
      const id = makeId('junction')
      nodeIdMap.set(node.id, id)
      const inputPortId = makeId('port-in')
      const outputPortId = makeId('port-out')
      portIdMap.set(node.data.inputPortId, inputPortId)
      portIdMap.set(node.data.outputPortId, outputPortId)
      return {
        ...node,
        id,
        position: offsetPosition(node.position, offset),
        data: { ...node.data, inputPortId, outputPortId },
      }
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
  const ifaceInputs: ExposedPort[] = []
  const ifaceOutputs: ExposedPort[] = []

  group.data.interface.inputs.forEach((p) => {
    const internalPort = group.data.portMap.inputs[p.id]
    const mapped = internalPort ? portIdMap.get(internalPort) : undefined
    if (!mapped) return
    const groupPort = makeId('group-in')
    inputs[groupPort] = mapped
    ifaceInputs.push({ id: groupPort, kind: 'input', name: p.name, mapsToInternalPortId: mapped })
  })
  group.data.interface.outputs.forEach((p) => {
    const internalPort = group.data.portMap.outputs[p.id]
    const mapped = internalPort ? portIdMap.get(internalPort) : undefined
    if (!mapped) return
    const groupPort = makeId('group-out')
    outputs[groupPort] = mapped
    ifaceOutputs.push({ id: groupPort, kind: 'output', name: p.name, mapsToInternalPortId: mapped })
  })

  return { interface: { inputs: ifaceInputs, outputs: ifaceOutputs }, portMap: { inputs, outputs } }
}

function offsetPosition(position: Position, offset: Position): Position {
  return { x: position.x + offset.x, y: position.y + offset.y }
}
