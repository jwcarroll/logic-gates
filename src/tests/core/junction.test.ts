import { describe, expect, it } from 'vitest'
import { simulate } from '../../core/simulation'
import type { Circuit, JunctionNode, Wire } from '../../core/types'
import { createLightNode, createSwitchNode } from '../../core/factories'

describe('junction', () => {
  it('buffers input to output and supports fan-out', () => {
    const sw = createSwitchNode({ x: 0, y: 0 })
    const light1 = createLightNode({ x: 200, y: 0 })
    const light2 = createLightNode({ x: 200, y: 80 })
    const junction: JunctionNode = {
      id: 'j1',
      type: 'junction',
      position: { x: 100, y: 40 },
      width: 60,
      height: 40,
      data: { inputPortId: 'j-in', outputPortId: 'j-out' },
    }

    const wires: Wire[] = [
      { id: 'w1', source: sw.data.outputPortId, sourceNode: sw.id, target: junction.data.inputPortId, targetNode: junction.id },
      { id: 'w2', source: junction.data.outputPortId, sourceNode: junction.id, target: light1.data.inputPortId, targetNode: light1.id },
      { id: 'w3', source: junction.data.outputPortId, sourceNode: junction.id, target: light2.data.inputPortId, targetNode: light2.id },
    ]

    const circuit: Circuit = { nodes: [sw, junction, light1, light2], wires }
    const sim1 = simulate(circuit)
    expect(sim1.lights[light1.id]).toBe(false)
    expect(sim1.lights[light2.id]).toBe(false)

    const circuitOn: Circuit = {
      ...circuit,
      nodes: circuit.nodes.map((n) => (n.id === sw.id ? { ...n, data: { ...n.data, state: true } } : n)),
    }
    const sim2 = simulate(circuitOn)
    expect(sim2.lights[light1.id]).toBe(true)
    expect(sim2.lights[light2.id]).toBe(true)
  })
})

