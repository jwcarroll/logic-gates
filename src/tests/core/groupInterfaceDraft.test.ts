import { describe, expect, it } from 'vitest'
import type { Circuit } from '../../core/types'
import { createGateNode, createSwitchNode } from '../../core/factories'
import { buildDefaultGroupInterfaceDraft } from '../../core/groupInterfaceDraft'

describe('buildDefaultGroupInterfaceDraft', () => {
  it('collapses fanout inputs to one exposed port per outside source', () => {
    const swA = createSwitchNode({ x: 0, y: 0 })
    const swB = createSwitchNode({ x: 0, y: 80 })
    const xorGate = createGateNode('XOR', { x: 200, y: 40 })
    const andGate = createGateNode('AND', { x: 200, y: 140 })

    const circuit: Circuit = {
      nodes: [swA, swB, xorGate, andGate],
      wires: [
        // A fans out to XOR.in0 + AND.in0
        { id: 'w-a-xor', source: swA.data.outputPortId, sourceNode: swA.id, target: xorGate.data.inputPortIds[0], targetNode: xorGate.id },
        { id: 'w-a-and', source: swA.data.outputPortId, sourceNode: swA.id, target: andGate.data.inputPortIds[0], targetNode: andGate.id },
        // B fans out to XOR.in1 + AND.in1
        { id: 'w-b-xor', source: swB.data.outputPortId, sourceNode: swB.id, target: xorGate.data.inputPortIds[1], targetNode: xorGate.id },
        { id: 'w-b-and', source: swB.data.outputPortId, sourceNode: swB.id, target: andGate.data.inputPortIds[1], targetNode: andGate.id },
      ],
    }

    const draft = buildDefaultGroupInterfaceDraft(circuit, [xorGate.id, andGate.id])
    expect(draft.ok).toBe(true)
    expect(draft.value?.inputs).toHaveLength(2)
  })
})

