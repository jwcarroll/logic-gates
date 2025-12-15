import { describe, expect, it } from 'vitest'
import type { Circuit, GroupNode, JunctionNode } from '../../core/types'
import { createGateNode, createLightNode, createSwitchNode } from '../../core/factories'
import { createGroup } from '../../core/commands'

describe('createGroup', () => {
  it('rewires boundary wires and persists explicit interface names + ordering', () => {
    const swA = createSwitchNode({ x: 0, y: 0 })
    const swB = createSwitchNode({ x: 0, y: 80 })
    const gate = createGateNode('AND', { x: 200, y: 40 })
    const light = createLightNode({ x: 420, y: 40 })

    const circuit: Circuit = {
      nodes: [swA, swB, gate, light],
      wires: [
        { id: 'w-a', source: swA.data.outputPortId, sourceNode: swA.id, target: gate.data.inputPortIds[0], targetNode: gate.id },
        { id: 'w-b', source: swB.data.outputPortId, sourceNode: swB.id, target: gate.data.inputPortIds[1], targetNode: gate.id },
        { id: 'w-out', source: gate.data.outputPortId, sourceNode: gate.id, target: light.data.inputPortId, targetNode: light.id },
      ],
    }

    const result = createGroup(circuit, {
      nodeIds: [gate.id],
      label: 'Gate Group',
      collapsed: true,
      interfaceDraft: {
        inputs: [
          { id: 'in-a', kind: 'input', name: 'A', mapsToInternalPortId: gate.data.inputPortIds[0] },
          { id: 'in-b', kind: 'input', name: 'B', mapsToInternalPortId: gate.data.inputPortIds[1] },
        ],
        outputs: [{ id: 'out-y', kind: 'output', name: 'Y', mapsToInternalPortId: gate.data.outputPortId }],
      },
    })

    expect(result.ok).toBe(true)
    const next = result.value as Circuit
    const group = next.nodes.find((n) => n.type === 'group') as GroupNode
    expect(group.data.interface.inputs.map((p) => p.name)).toEqual(['A', 'B'])
    expect(group.data.interface.outputs.map((p) => p.name)).toEqual(['Y'])
    expect(group.data.interface.inputs.map((p) => p.id)).toEqual(['in-a', 'in-b'])
    expect(group.data.interface.outputs.map((p) => p.id)).toEqual(['out-y'])

    // External wires are rewired to group ports
    const rewiredInboundTargets = next.wires.filter((w) => w.targetNode === group.id).map((w) => w.target)
    expect(rewiredInboundTargets).toEqual(expect.arrayContaining(['in-a', 'in-b']))
    const rewiredOutboundSources = next.wires.filter((w) => w.sourceNode === group.id).map((w) => w.source)
    expect(rewiredOutboundSources).toEqual(expect.arrayContaining(['out-y']))

    // Group mapping points to junction ports (not raw gate ports)
    const mappedInputs = Object.values(group.data.portMap.inputs)
    const mappedOutputs = Object.values(group.data.portMap.outputs)
    expect(mappedInputs).not.toEqual(expect.arrayContaining(gate.data.inputPortIds))
    expect(mappedOutputs).not.toEqual(expect.arrayContaining([gate.data.outputPortId]))

    // Junction nodes exist inside the group
    const junctions = next.nodes.filter((n) => n.type === 'junction') as JunctionNode[]
    expect(junctions.length).toBeGreaterThan(0)
    junctions.forEach((j) => expect(j.groupId).toBe(group.id))
  })

  it('rejects drafts with no exposed ports', () => {
    const gate = createGateNode('AND', { x: 0, y: 0 })
    const circuit: Circuit = { nodes: [gate], wires: [] }
    const result = createGroup(circuit, { nodeIds: [gate.id], label: 'Empty', interfaceDraft: { inputs: [], outputs: [] } })
    expect(result.ok).toBe(false)
  })
})

