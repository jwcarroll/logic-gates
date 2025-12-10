import { describe, expect, it } from 'vitest'
import { validateWire } from '../../core/validation'
import { createGateNode, createLightNode, createSwitchNode } from '../../core/factories'
import type { Circuit, Wire } from '../../core/types'

const baseCircuit: Circuit = { nodes: [], wires: [] }

describe('graph validation', () => {
  it('allows output → input with unused target', () => {
    const s = createSwitchNode({ x: 0, y: 0 })
    const light = createLightNode({ x: 200, y: 0 })
    const circuit: Circuit = { ...baseCircuit, nodes: [s, light] }
    const wire: Wire = {
      id: 'w1',
      source: s.data.outputPortId,
      target: light.data.inputPortId,
      sourceNode: s.id,
      targetNode: light.id,
    }
    const result = validateWire(circuit, wire)
    expect(result.ok).toBe(true)
    expect(result.value).toBeDefined()
  })

  it('rejects invalid direction, self-loop, and duplicate input', () => {
    const s1 = createSwitchNode({ x: 0, y: 0 })
    const s2 = createSwitchNode({ x: 0, y: 50 })
    const light = createLightNode({ x: 200, y: 0 })
    const circuit: Circuit = { ...baseCircuit, nodes: [s1, s2, light] }

    // self-loop
    const selfWire: Wire = {
      id: 'w-self',
      source: s1.data.outputPortId,
      target: s1.data.outputPortId,
      sourceNode: s1.id,
      targetNode: s1.id,
    }
    expect(validateWire(circuit, selfWire).ok).toBe(false)

    // wrong direction
    const wrongDir: Wire = {
      id: 'w-wrong',
      source: light.data.inputPortId,
      target: s1.data.outputPortId,
      sourceNode: light.id,
      targetNode: s1.id,
    }
    expect(validateWire(circuit, wrongDir).ok).toBe(false)

    // duplicate input
    const first: Wire = {
      id: 'w1',
      source: s1.data.outputPortId,
      target: light.data.inputPortId,
      sourceNode: s1.id,
      targetNode: light.id,
    }
    const second: Wire = {
      id: 'w2',
      source: s2.data.outputPortId,
      target: light.data.inputPortId,
      sourceNode: s2.id,
      targetNode: light.id,
    }
    const circuitWithFirst: Circuit = { ...circuit, wires: [first] }
    expect(validateWire(circuitWithFirst, second).ok).toBe(false)
  })

  it('rejects missing nodes/ports', () => {
    const gate = createGateNode('AND', { x: 100, y: 0 })
    const circuit: Circuit = { ...baseCircuit, nodes: [gate] }
    const wire: Wire = {
      id: 'w-missing',
      source: 'unknown',
      target: gate.data.inputPortIds[0],
      sourceNode: 'missing-node',
      targetNode: gate.id,
    }
    const result = validateWire(circuit, wire)
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('Source or target node missing')
  })
})
