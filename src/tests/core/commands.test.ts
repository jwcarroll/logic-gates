import { describe, expect, it } from 'vitest'
import type { Circuit } from '../../core/types'
import { addWire } from '../../core/commands'
import { createGateNode, createLightNode, createSwitchNode } from '../../core/factories'

const baseCircuit: Circuit = {
  nodes: [],
  wires: [],
}

describe('addWire', () => {
  it('accepts output → input connections', () => {
    const a = createSwitchNode({ x: 0, y: 0 })
    const gate = createGateNode('AND', { x: 100, y: 0 })
    const circuit: Circuit = { ...baseCircuit, nodes: [a, gate] }

    const result = addWire(circuit, {
      source: a.id,
      target: gate.id,
      sourceHandle: a.data.outputPortId,
      targetHandle: gate.data.inputPortIds[0],
    })

    expect(result.ok).toBe(true)
    expect(result.next.wires).toHaveLength(1)
    expect(result.next.wires[0].source).toBe(a.data.outputPortId)
    expect(result.next.wires[0].target).toBe(gate.data.inputPortIds[0])
  })

  it('rejects input→input and duplicate input connections', () => {
    const s1 = createSwitchNode({ x: 0, y: 0 })
    const s2 = createSwitchNode({ x: 0, y: 50 })
    const light = createLightNode({ x: 200, y: 0 })
    const circuit: Circuit = { ...baseCircuit, nodes: [s1, s2, light] }

    const first = addWire(circuit, {
      source: s1.id,
      target: light.id,
      sourceHandle: s1.data.outputPortId,
      targetHandle: light.data.inputPortId,
    })
    expect(first.ok).toBe(true)

    const dup = addWire(first.next, {
      source: s2.id,
      target: light.id,
      sourceHandle: s2.data.outputPortId,
      targetHandle: light.data.inputPortId,
    })
    expect(dup.ok).toBe(false)

    const invalidDir = addWire(circuit, {
      source: light.id,
      target: s1.id,
      sourceHandle: light.data.inputPortId,
      targetHandle: s1.data.outputPortId,
    })
    expect(invalidDir.ok).toBe(false)
  })
})
