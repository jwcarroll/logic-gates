import { describe, expect, it } from 'vitest'
import type { Circuit } from '../../core/types'
import { connect } from '../../core/commands'
import { createGateNode, createLightNode, createSwitchNode } from '../../core/factories'

const baseCircuit: Circuit = {
  nodes: [],
  wires: [],
}

describe('connect', () => {
  it('accepts output → input connections', () => {
    const a = createSwitchNode({ x: 0, y: 0 })
    const gate = createGateNode('AND', { x: 100, y: 0 })
    const circuit: Circuit = { ...baseCircuit, nodes: [a, gate] }

    const result = connect(circuit, {
      sourceNodeId: a.id,
      targetNodeId: gate.id,
      sourcePortId: a.data.outputPortId,
      targetPortId: gate.data.inputPortIds[0],
    })

    expect(result.ok).toBe(true)
    expect(result.value?.wires).toHaveLength(1)
    expect(result.value?.wires[0].source).toBe(a.data.outputPortId)
    expect(result.value?.wires[0].target).toBe(gate.data.inputPortIds[0])
  })

  it('rejects input→input and duplicate input connections', () => {
    const s1 = createSwitchNode({ x: 0, y: 0 })
    const s2 = createSwitchNode({ x: 0, y: 50 })
    const light = createLightNode({ x: 200, y: 0 })
    const circuit: Circuit = { ...baseCircuit, nodes: [s1, s2, light] }

    const first = connect(circuit, {
      sourceNodeId: s1.id,
      targetNodeId: light.id,
      sourcePortId: s1.data.outputPortId,
      targetPortId: light.data.inputPortId,
    })
    expect(first.ok).toBe(true)

    const dup = connect(first.value!, {
      sourceNodeId: s2.id,
      targetNodeId: light.id,
      sourcePortId: s2.data.outputPortId,
      targetPortId: light.data.inputPortId,
    })
    expect(dup.ok).toBe(false)

    const invalidDir = connect(circuit, {
      sourceNodeId: light.id,
      targetNodeId: s1.id,
      sourcePortId: light.data.inputPortId,
      targetPortId: s1.data.outputPortId,
    })
    expect(invalidDir.ok).toBe(false)
  })
})
