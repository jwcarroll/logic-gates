import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'

describe('circuit store', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('propagates signals through an AND circuit after toggling switches', () => {
    const store = useAppStore.getState()
    store.addSwitch()
    store.addSwitch()
    store.addGate('AND')
    store.addLight()

    const circuit = useAppStore.getState().circuit
    const switchA = circuit.nodes.find((n) => n.type === 'switch')!
    const switchB = circuit.nodes.filter((n) => n.type === 'switch')[1]!
    const gate = circuit.nodes.find((n) => n.type === 'gate')!
    const light = circuit.nodes.find((n) => n.type === 'light')!

    // wire switches -> gate inputs
    store.connectWire({
      source: switchA.id,
      sourceHandle: switchA.data.outputPortId,
      target: gate.id,
      targetHandle: gate.data.inputPortIds[0],
    })
    store.connectWire({
      source: switchB.id,
      sourceHandle: switchB.data.outputPortId,
      target: gate.id,
      targetHandle: gate.data.inputPortIds[1],
    })
    // gate -> light
    store.connectWire({
      source: gate.id,
      sourceHandle: gate.data.outputPortId,
      target: light.id,
      targetHandle: light.data.inputPortId,
    })

    expect(useAppStore.getState().lights[light.id]).toBe(false)

    store.toggleSwitch(switchA.id)
    store.toggleSwitch(switchB.id)

    expect(useAppStore.getState().outputs[gate.data.outputPortId]).toBe(true)
    expect(useAppStore.getState().lights[light.id]).toBe(true)
  })
})
