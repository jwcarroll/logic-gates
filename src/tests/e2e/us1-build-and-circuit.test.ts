import { describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'

describe('US1 build AND circuit', () => {
  it('builds a two-input AND circuit and reflects outputs when toggled', () => {
    const store = useAppStore.getState()
    store.reset()

    // Add components
    store.addSwitch()
    store.addSwitch()
    store.addGate('AND')
    store.addLight()

    const nodes = useAppStore.getState().circuit.nodes
    const switches = nodes.filter((n) => n.type === 'switch')
    const gate = nodes.find((n) => n.type === 'gate')!
    const light = nodes.find((n) => n.type === 'light')!

    // Wire: sw1 -> gate input0, sw2 -> gate input1, gate -> light
    const connect = useAppStore.getState().connectWire
    connect({
      source: switches[0].id,
      target: gate.id,
      sourceHandle: switches[0].data.outputPortId,
      targetHandle: gate.data.inputPortIds[0],
    })
    connect({
      source: switches[1].id,
      target: gate.id,
      sourceHandle: switches[1].data.outputPortId,
      targetHandle: gate.data.inputPortIds[1],
    })
    connect({
      source: gate.id,
      target: light.id,
      sourceHandle: gate.data.outputPortId,
      targetHandle: light.data.inputPortId,
    })

    const wired = useAppStore.getState()
    expect(wired.circuit.wires).toHaveLength(3)
    expect(wired.lights[light.id]).toBe(false)

    // Toggle switches on
    useAppStore.getState().toggleSwitch(switches[0].id)
    useAppStore.getState().toggleSwitch(switches[1].id)

    const afterToggle = useAppStore.getState()
    expect(afterToggle.lights[light.id]).toBe(true)
    expect(afterToggle.outputs[gate.data.outputPortId]).toBe(true)
  })

  it('allows fan-out from switches to multiple gates with unique inputs', () => {
    const store = useAppStore.getState()
    store.reset()

    store.addGate('AND') // andGate1
    store.addGate('AND') // andGate2
    store.addSwitch() // switch1
    store.addSwitch() // switch2

    const { nodes } = useAppStore.getState().circuit
    const gates = nodes.filter((n) => n.type === 'gate')
    const switches = nodes.filter((n) => n.type === 'switch')
    const [andGate1, andGate2] = gates
    const [switch1, switch2] = switches

    const connect = useAppStore.getState().connectWire
    // switch1 → both gates (input 0)
    const first = connect({
      source: switch1.id,
      target: andGate1.id,
      sourceHandle: switch1.data.outputPortId,
      targetHandle: andGate1.data.inputPortIds[0],
    })
    const second = connect({
      source: switch1.id,
      target: andGate2.id,
      sourceHandle: switch1.data.outputPortId,
      targetHandle: andGate2.data.inputPortIds[0],
    })
    // switch2 → both gates (input 1)
    const third = connect({
      source: switch2.id,
      target: andGate1.id,
      sourceHandle: switch2.data.outputPortId,
      targetHandle: andGate1.data.inputPortIds[1],
    })
    const fourth = connect({
      source: switch2.id,
      target: andGate2.id,
      sourceHandle: switch2.data.outputPortId,
      targetHandle: andGate2.data.inputPortIds[1],
    })

    expect(first && second && third && fourth).toBe(true)
    expect(useAppStore.getState().circuit.wires).toHaveLength(4)
  })
})
