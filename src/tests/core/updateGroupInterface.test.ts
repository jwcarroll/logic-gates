import { describe, expect, it } from 'vitest'
import type { Circuit, GroupNode, GroupInterface, JunctionNode } from '../../core/types'
import { createGateNode, createLightNode, createSwitchNode } from '../../core/factories'
import { createGroup, updateGroupInterface } from '../../core/commands'

describe('updateGroupInterface', () => {
  it('disconnects all external wires and updates the group interface', () => {
    const swA = createSwitchNode({ x: 0, y: 0 })
    const gate = createGateNode('NOT', { x: 200, y: 0 })
    const light = createLightNode({ x: 420, y: 0 })

    const circuit: Circuit = {
      nodes: [swA, gate, light],
      wires: [
        { id: 'w-in', source: swA.data.outputPortId, sourceNode: swA.id, target: gate.data.inputPortIds[0], targetNode: gate.id },
        { id: 'w-out', source: gate.data.outputPortId, sourceNode: gate.id, target: light.data.inputPortId, targetNode: light.id },
      ],
    }

    const grouped = createGroup(circuit, {
      nodeIds: [gate.id],
      label: 'G',
      collapsed: true,
      interfaceDraft: {
        inputs: [{ id: 'in-a', kind: 'input', name: 'A', mapsToInternalPortId: gate.data.inputPortIds[0] }],
        outputs: [{ id: 'out-y', kind: 'output', name: 'Y', mapsToInternalPortId: gate.data.outputPortId }],
      },
    })
    expect(grouped.ok).toBe(true)
    const after = grouped.value as Circuit
    const group = after.nodes.find((n) => n.type === 'group') as GroupNode

    const junctions = after.nodes.filter((n) => n.type === 'junction' && n.groupId === group.id) as JunctionNode[]
    expect(junctions.length).toBeGreaterThan(0)
    const inputJunction = junctions[0]
    const outputJunction = junctions[1] ?? junctions[0]

    const nextInterface: GroupInterface = {
      inputs: [{ id: 'in-a2', kind: 'input', name: 'A2', mapsToInternalPortId: inputJunction.data.outputPortId }],
      outputs: [{ id: 'out-y2', kind: 'output', name: 'Y2', mapsToInternalPortId: outputJunction.data.inputPortId }],
    }

    const updated = updateGroupInterface(after, group.id, nextInterface)
    expect(updated.ok).toBe(true)
    const value = updated.value!
    expect(value.disconnectedWireIds).toEqual(expect.arrayContaining(after.wires.filter((w) => w.sourceNode === group.id || w.targetNode === group.id).map((w) => w.id)))
    expect(value.circuit.wires.some((w) => w.sourceNode === group.id || w.targetNode === group.id)).toBe(false)

    const updatedGroup = value.circuit.nodes.find((n) => n.type === 'group' && n.id === group.id) as GroupNode
    expect(updatedGroup.data.interface.inputs.map((p) => p.name)).toEqual(['A2'])
    expect(updatedGroup.data.interface.outputs.map((p) => p.name)).toEqual(['Y2'])
  })

  it('rejects invalid mapping convention (FR-006a)', () => {
    const swA = createSwitchNode({ x: 0, y: 0 })
    const gate = createGateNode('NOT', { x: 200, y: 0 })
    const circuit: Circuit = {
      nodes: [swA, gate],
      wires: [{ id: 'w-in', source: swA.data.outputPortId, sourceNode: swA.id, target: gate.data.inputPortIds[0], targetNode: gate.id }],
    }

    const grouped = createGroup(circuit, {
      nodeIds: [gate.id],
      label: 'G',
      interfaceDraft: { inputs: [{ id: 'in-a', kind: 'input', name: 'A', mapsToInternalPortId: gate.data.inputPortIds[0] }], outputs: [] },
    })
    expect(grouped.ok).toBe(true)
    const after = grouped.value as Circuit
    const group = after.nodes.find((n) => n.type === 'group') as GroupNode
    const junction = after.nodes.find((n) => n.type === 'junction' && n.groupId === group.id) as JunctionNode

    const invalid: GroupInterface = {
      inputs: [{ id: 'in-x', kind: 'input', name: 'X', mapsToInternalPortId: junction.data.inputPortId }],
      outputs: [],
    }
    const res = updateGroupInterface(after, group.id, invalid)
    expect(res.ok).toBe(false)
  })
})
