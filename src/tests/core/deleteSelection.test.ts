import { describe, expect, it } from 'vitest'
import type { Circuit, Wire } from '../../core/types'
import { createLightNode, createSwitchNode } from '../../core/factories'
import { deleteSelection } from '../../core/commands'

describe('deleteSelection (core)', () => {
  it('deletes a selected node and cascades incident wires', () => {
    const sw = createSwitchNode({ x: 0, y: 0 })
    const light = createLightNode({ x: 200, y: 0 })
    const wire: Wire = {
      id: 'wire-1',
      source: sw.data.outputPortId,
      target: light.data.inputPortId,
      sourceNode: sw.id,
      targetNode: light.id,
    }

    const circuit: Circuit = { nodes: [sw, light], wires: [wire] }
    const result = deleteSelection(circuit, { nodeIds: [light.id], wireIds: [] })

    expect(result.circuit.nodes.map((n) => n.id)).toEqual([sw.id])
    expect(result.circuit.wires).toHaveLength(0)
    expect(result.deleted.nodeIds).toEqual([light.id])
    expect(result.deleted.wireIds).toEqual([wire.id])
  })

  it('deletes a selected wire without deleting nodes', () => {
    const sw = createSwitchNode({ x: 0, y: 0 })
    const light = createLightNode({ x: 200, y: 0 })
    const wire: Wire = {
      id: 'wire-1',
      source: sw.data.outputPortId,
      target: light.data.inputPortId,
      sourceNode: sw.id,
      targetNode: light.id,
    }

    const circuit: Circuit = { nodes: [sw, light], wires: [wire] }
    const result = deleteSelection(circuit, { nodeIds: [], wireIds: [wire.id] })

    expect(result.circuit.nodes.map((n) => n.id).sort()).toEqual([light.id, sw.id].sort())
    expect(result.circuit.wires).toHaveLength(0)
    expect(result.deleted.nodeIds).toEqual([])
    expect(result.deleted.wireIds).toEqual([wire.id])
  })

  it('deletes a mixed multi-selection without duplicating overlapping wire deletes', () => {
    const sw = createSwitchNode({ x: 0, y: 0 })
    const light = createLightNode({ x: 200, y: 0 })
    const wire: Wire = {
      id: 'wire-1',
      source: sw.data.outputPortId,
      target: light.data.inputPortId,
      sourceNode: sw.id,
      targetNode: light.id,
    }

    const circuit: Circuit = { nodes: [sw, light], wires: [wire] }
    const result = deleteSelection(circuit, { nodeIds: [sw.id], wireIds: [wire.id] })

    expect(result.circuit.nodes.map((n) => n.id)).toEqual([light.id])
    expect(result.circuit.wires).toHaveLength(0)
    expect(result.deleted.nodeIds).toEqual([sw.id])
    expect(result.deleted.wireIds).toEqual([wire.id])
  })

  it('recursively deletes group children', () => {
    const child = createSwitchNode({ x: 0, y: 0 })
    const light = createLightNode({ x: 200, y: 0 })

    const groupId = 'group-1'
    const group = {
      id: groupId,
      type: 'group' as const,
      position: { x: 0, y: 0 },
      width: 200,
      height: 200,
      data: {
        label: 'G',
        childNodeIds: [child.id],
        collapsed: true,
        interface: { inputs: [], outputs: [] },
        portMap: { inputs: {}, outputs: {} },
      },
    }

    const childInGroup = { ...child, groupId }
    const wire: Wire = {
      id: 'wire-1',
      source: child.data.outputPortId,
      target: light.data.inputPortId,
      sourceNode: child.id,
      targetNode: light.id,
    }

    const circuit: Circuit = { nodes: [group, childInGroup, light], wires: [wire] }
    const result = deleteSelection(circuit, { nodeIds: [groupId], wireIds: [] })

    expect(result.circuit.nodes.map((n) => n.id)).toEqual([light.id])
    expect(result.circuit.wires).toHaveLength(0)
    expect(result.deleted.nodeIds.sort()).toEqual([groupId, child.id].sort())
    expect(result.deleted.wireIds).toEqual([wire.id])
  })

  it('treats unknown ids as a no-op', () => {
    const sw = createSwitchNode({ x: 0, y: 0 })
    const circuit: Circuit = { nodes: [sw], wires: [] }

    const result = deleteSelection(circuit, { nodeIds: ['missing-node'], wireIds: ['missing-wire'] })

    expect(result.circuit.nodes.map((n) => n.id)).toEqual([sw.id])
    expect(result.circuit.wires).toHaveLength(0)
    expect(result.deleted.nodeIds).toEqual([])
    expect(result.deleted.wireIds).toEqual([])
  })
})
