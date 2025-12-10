import { describe, expect, it } from 'vitest'
import { cloneGroup, groupNodes, ungroup } from '../../core/commands'
import { createGateNode, createLightNode, createSwitchNode } from '../../core/factories'
import type { Circuit, GateNode, GroupNode, Wire } from '../../core/types'

function buildAndCircuit(): { circuit: Circuit; gate: GateNode; wires: Wire[] } {
  const switchA = createSwitchNode({ x: 0, y: 0 })
  const switchB = createSwitchNode({ x: 0, y: 80 })
  const gate = createGateNode('AND', { x: 200, y: 40 })
  const light = createLightNode({ x: 420, y: 40 })

  const wires: Wire[] = [
    {
      id: 'w1',
      source: switchA.data.outputPortId,
      target: gate.data.inputPortIds[0],
      sourceNode: switchA.id,
      targetNode: gate.id,
    },
    {
      id: 'w2',
      source: switchB.data.outputPortId,
      target: gate.data.inputPortIds[1],
      sourceNode: switchB.id,
      targetNode: gate.id,
    },
    {
      id: 'w3',
      source: gate.data.outputPortId,
      target: light.data.inputPortId,
      sourceNode: gate.id,
      targetNode: light.id,
    },
  ]

  return {
    circuit: { nodes: [switchA, switchB, gate, light], wires },
    gate,
    wires,
  }
}

describe('grouping commands', () => {
  it('creates a group with port mappings for boundary ports', () => {
    const { circuit, gate } = buildAndCircuit()
    const result = groupNodes(circuit, { nodeIds: [gate.id], label: 'Gate Group' })

    expect(result.ok).toBe(true)
    const groupedCircuit = result.value as Circuit
    const group = groupedCircuit.nodes.find((n) => n.type === 'group') as GroupNode
    expect(group).toBeDefined()
    expect(group.data.childNodeIds).toEqual([gate.id])
    expect(group.data.inputPortIds).toHaveLength(2)
    expect(group.data.outputPortIds).toHaveLength(1)
    expect(Object.values(group.data.portMap.inputs)).toEqual(expect.arrayContaining(gate.data.inputPortIds))
    expect(Object.values(group.data.portMap.outputs)).toContain(gate.data.outputPortId)

    const groupedGate = groupedCircuit.nodes.find((n) => n.id === gate.id) as GateNode
    expect(groupedGate.groupId).toBe(group.id)
  })

  it('clones a group and remaps child node and port ids', () => {
    const { circuit, gate } = buildAndCircuit()
    const grouped = groupNodes(circuit, { nodeIds: [gate.id], label: 'Gate Group' }).value as Circuit
    const originalGroup = grouped.nodes.find((n) => n.type === 'group') as GroupNode
    const cloneResult = cloneGroup(grouped, originalGroup.id, { x: 40, y: 40 })

    expect(cloneResult.ok).toBe(true)
    const clonedCircuit = cloneResult.value as Circuit
    const groups = clonedCircuit.nodes.filter((n) => n.type === 'group') as GroupNode[]
    expect(groups).toHaveLength(2)
    const clonedGroup = groups.find((g) => g.id !== originalGroup.id) as GroupNode
    expect(clonedGroup).toBeDefined()

    const clonedChildIds = clonedGroup.data.childNodeIds
    expect(clonedChildIds).toHaveLength(1)
    const clonedGate = clonedCircuit.nodes.find((n) => clonedChildIds.includes(n.id)) as GateNode
    expect(clonedGate.id).not.toBe(gate.id)
    expect(clonedGate.groupId).toBe(clonedGroup.id)

    const clonedInputTargets = Object.values(clonedGroup.data.portMap.inputs)
    expect(clonedInputTargets).toContain(clonedGate.data.inputPortIds[0])
    expect(clonedInputTargets).not.toContain(gate.data.inputPortIds[0])

    const clonedOutputTargets = Object.values(clonedGroup.data.portMap.outputs)
    expect(clonedOutputTargets).toContain(clonedGate.data.outputPortId)
    expect(clonedOutputTargets).not.toContain(gate.data.outputPortId)
  })

  it('ungroups nodes and removes the group node', () => {
    const { circuit, gate } = buildAndCircuit()
    const groupedCircuit = groupNodes(circuit, { nodeIds: [gate.id], label: 'Gate Group' }).value as Circuit
    const group = groupedCircuit.nodes.find((n) => n.type === 'group') as GroupNode

    const ungrouped = ungroup(groupedCircuit, group.id)
    expect(ungrouped.ok).toBe(true)
    const resultCircuit = ungrouped.value as Circuit
    expect(resultCircuit.nodes.some((n) => n.type === 'group')).toBe(false)

    const gateAfter = resultCircuit.nodes.find((n) => n.id === gate.id) as GateNode
    expect(gateAfter.groupId).toBeUndefined()
  })

  it('returns an error when attempting to group unknown nodes', () => {
    const { circuit } = buildAndCircuit()
    const result = groupNodes(circuit, { nodeIds: ['missing-node'], label: 'Broken Group' })
    expect(result.ok).toBe(false)
    expect(result.errors?.[0]).toMatch(/missing/)
  })
})
