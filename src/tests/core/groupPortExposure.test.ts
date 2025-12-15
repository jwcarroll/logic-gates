import { describe, expect, it } from 'vitest'
import type { Circuit, GroupNode } from '../../core/types'
import { createGateNode, createSwitchNode } from '../../core/factories'
import { createGroup } from '../../core/commands'
import { toReactFlowNodes } from '../../app/reactFlowAdapter'

describe('[US2] group port exposure', () => {
  it('does not surface internal-only ports on collapsed groups', () => {
    const sw = createSwitchNode({ x: 0, y: 0 })
    const gate = createGateNode('AND', { x: 200, y: 0 })

    const circuit: Circuit = {
      nodes: [sw, gate],
      wires: [{ id: 'w1', source: sw.data.outputPortId, sourceNode: sw.id, target: gate.data.inputPortIds[0], targetNode: gate.id }],
    }

    const grouped = createGroup(circuit, {
      nodeIds: [gate.id],
      label: 'One-In',
      collapsed: true,
      interfaceDraft: {
        inputs: [{ id: 'in-a', kind: 'input', name: 'A', mapsToInternalPortId: gate.data.inputPortIds[0] }],
        outputs: [],
      },
    })
    expect(grouped.ok).toBe(true)
    const next = grouped.value as Circuit
    const group = next.nodes.find((n) => n.type === 'group') as GroupNode

    expect(group.data.interface.inputs).toHaveLength(1)
    expect(group.data.interface.inputs[0].id).toBe('in-a')

    // The other gate input is internal-only and should not be exposed.
    expect(group.data.interface.inputs.map((p) => p.mapsToInternalPortId)).not.toContain(gate.data.inputPortIds[1])

    const rfNodes = toReactFlowNodes(next, {}, {}, { onToggleSwitch: () => undefined })
    const rfGroup = rfNodes.find((n) => n.id === group.id)
    expect(rfGroup?.data.inputs).toEqual(['in-a'])
    expect(rfGroup?.data.inputs).not.toContain(gate.data.inputPortIds[1])
  })
})

