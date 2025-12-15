import { describe, expect, it } from 'vitest'
import { cloneGroup, createGroup, ungroup } from '../../core/commands'
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
    const result = createGroup(circuit, {
      nodeIds: [gate.id],
      label: 'Gate Group',
      collapsed: true,
      interfaceDraft: {
        inputs: gate.data.inputPortIds.map((portId, idx) => ({
          id: `group-in-${idx + 1}`,
          kind: 'input' as const,
          name: `In ${idx + 1}`,
          mapsToInternalPortId: portId,
        })),
        outputs: [
          {
            id: 'group-out-1',
            kind: 'output' as const,
            name: 'Out 1',
            mapsToInternalPortId: gate.data.outputPortId,
          },
        ],
      },
    })

    expect(result.ok).toBe(true)
    const groupedCircuit = result.value as Circuit
    const group = groupedCircuit.nodes.find((n) => n.type === 'group') as GroupNode
    expect(group).toBeDefined()
    expect(group.data.childNodeIds).toContain(gate.id)
    expect(group.data.interface.inputs).toHaveLength(2)
    expect(group.data.interface.outputs).toHaveLength(1)
    const junctions = groupedCircuit.nodes.filter((n) => n.type === 'junction' && n.groupId === group.id)
    expect(junctions).toHaveLength(3)
    const junctionOutputPorts = new Set(junctions.map((n) => n.data.outputPortId))
    const junctionInputPorts = new Set(junctions.map((n) => n.data.inputPortId))

    const mappedInputTargets = Object.values(group.data.portMap.inputs)
    const mappedOutputTargets = Object.values(group.data.portMap.outputs)
    mappedInputTargets.forEach((portId) => expect(junctionOutputPorts.has(portId)).toBe(true))
    mappedOutputTargets.forEach((portId) => expect(junctionInputPorts.has(portId)).toBe(true))

    expect(new Set(Object.keys(group.data.portMap.inputs))).toEqual(new Set(group.data.interface.inputs.map((p) => p.id)))
    expect(new Set(Object.keys(group.data.portMap.outputs))).toEqual(new Set(group.data.interface.outputs.map((p) => p.id)))
    expect(new Set(mappedInputTargets)).toEqual(new Set(group.data.interface.inputs.map((p) => p.mapsToInternalPortId)))
    expect(new Set(mappedOutputTargets)).toEqual(new Set(group.data.interface.outputs.map((p) => p.mapsToInternalPortId)))

    const groupedGate = groupedCircuit.nodes.find((n) => n.id === gate.id) as GateNode
    expect(groupedGate.groupId).toBe(group.id)
  })

  it('clones a group and remaps child node and port ids', () => {
    const { circuit, gate } = buildAndCircuit()
    const grouped = createGroup(circuit, {
      nodeIds: [gate.id],
      label: 'Gate Group',
      collapsed: true,
      interfaceDraft: {
        inputs: gate.data.inputPortIds.map((portId, idx) => ({
          id: `group-in-${idx + 1}`,
          kind: 'input' as const,
          name: `In ${idx + 1}`,
          mapsToInternalPortId: portId,
        })),
        outputs: [
          {
            id: 'group-out-1',
            kind: 'output' as const,
            name: 'Out 1',
            mapsToInternalPortId: gate.data.outputPortId,
          },
        ],
      },
    }).value as Circuit
    const originalGroup = grouped.nodes.find((n) => n.type === 'group') as GroupNode
    const cloneResult = cloneGroup(grouped, originalGroup.id, { x: 40, y: 40 })

    expect(cloneResult.ok).toBe(true)
    const clonedCircuit = cloneResult.value as Circuit
    const groups = clonedCircuit.nodes.filter((n) => n.type === 'group') as GroupNode[]
    expect(groups).toHaveLength(2)
    const clonedGroup = groups.find((g) => g.id !== originalGroup.id) as GroupNode
    expect(clonedGroup).toBeDefined()

    const clonedChildIds = clonedGroup.data.childNodeIds
    expect(clonedChildIds.length).toBeGreaterThan(1)
    const clonedGate = clonedCircuit.nodes.find((n) => n.type === 'gate' && clonedChildIds.includes(n.id)) as GateNode
    expect(clonedGate.id).not.toBe(gate.id)
    expect(clonedGate.groupId).toBe(clonedGroup.id)

    const clonedJunctions = clonedCircuit.nodes.filter((n) => n.type === 'junction' && n.groupId === clonedGroup.id)
    expect(clonedJunctions).toHaveLength(3)
    const clonedJunctionOutputPorts = new Set(clonedJunctions.map((n) => n.data.outputPortId))
    const clonedJunctionInputPorts = new Set(clonedJunctions.map((n) => n.data.inputPortId))

    const clonedInputTargets = Object.values(clonedGroup.data.portMap.inputs)
    const clonedOutputTargets = Object.values(clonedGroup.data.portMap.outputs)
    clonedInputTargets.forEach((portId) => expect(clonedJunctionOutputPorts.has(portId)).toBe(true))
    clonedOutputTargets.forEach((portId) => expect(clonedJunctionInputPorts.has(portId)).toBe(true))
  })

  it('ungroups nodes and removes the group node', () => {
    const { circuit, gate } = buildAndCircuit()
    const groupedCircuit = createGroup(circuit, {
      nodeIds: [gate.id],
      label: 'Gate Group',
      collapsed: true,
      interfaceDraft: {
        inputs: gate.data.inputPortIds.map((portId, idx) => ({
          id: `group-in-${idx + 1}`,
          kind: 'input' as const,
          name: `In ${idx + 1}`,
          mapsToInternalPortId: portId,
        })),
        outputs: [
          {
            id: 'group-out-1',
            kind: 'output' as const,
            name: 'Out 1',
            mapsToInternalPortId: gate.data.outputPortId,
          },
        ],
      },
    }).value as Circuit
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
    const result = createGroup(circuit, {
      nodeIds: ['missing-node'],
      label: 'Broken Group',
      collapsed: true,
      interfaceDraft: { inputs: [], outputs: [] },
    })
    expect(result.ok).toBe(false)
    expect(result.errors?.[0]).toMatch(/missing/)
  })
})
