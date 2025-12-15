import { describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'

function findExposedPortId(groupId: string, name: string) {
  const group = useAppStore.getState().circuit.nodes.find((n) => n.id === groupId && n.type === 'group')
  if (!group || group.type !== 'group') throw new Error('Group not found')
  const match = [...group.data.interface.inputs, ...group.data.interface.outputs].find((p) => p.name === name)
  if (!match) throw new Error(`Exposed port not found: ${name}`)
  return match.id
}

describe('US2 compose grouped subcircuits', () => {
  it('wires switches into grouped half-adder and reflects outputs', () => {
    const store = useAppStore.getState()
    store.reset()

    // Add reusable group and clone it to simulate reuse
    store.addHalfAdderTemplate()
    const group = useAppStore.getState().circuit.nodes.find((n) => n.type === 'group')!
    store.selectNodes([group.id])
    store.cloneSelectedGroup()

    // Use the first group instance for wiring with two switches and two lights
    const activeGroup = useAppStore.getState().circuit.nodes.find((n) => n.type === 'group')!
    store.addSwitch()
    store.addSwitch()
    store.addLight()
    store.addLight()

    const state = useAppStore.getState()
    const switches = state.circuit.nodes.filter((n) => n.type === 'switch')
    const lights = state.circuit.nodes.filter((n) => n.type === 'light')

    // map group ports (explicit interface)
    const groupInputA = findExposedPortId(activeGroup.id, 'A')
    const groupInputB = findExposedPortId(activeGroup.id, 'B')
    const groupSumOutput = findExposedPortId(activeGroup.id, 'SUM')
    const groupCarryOutput = findExposedPortId(activeGroup.id, 'CARRY')

    const connect = useAppStore.getState().connectWire
    connect({
      source: switches[0].id,
      target: activeGroup.id,
      sourceHandle: switches[0].data.outputPortId,
      targetHandle: groupInputA,
    })
    connect({
      source: switches[1].id,
      target: activeGroup.id,
      sourceHandle: switches[1].data.outputPortId,
      targetHandle: groupInputB,
    })

    connect({
      source: activeGroup.id,
      target: lights[0].id,
      sourceHandle: groupSumOutput,
      targetHandle: lights[0].data.inputPortId,
    })
    connect({
      source: activeGroup.id,
      target: lights[1].id,
      sourceHandle: groupCarryOutput,
      targetHandle: lights[1].data.inputPortId,
    })

    // Assert initial outputs off
    let updated = useAppStore.getState()
    expect(updated.lights[lights[0].id]).toBe(false)
    expect(updated.lights[lights[1].id]).toBe(false)

    // Toggle a single switch: sum should be true, carry false
    useAppStore.getState().toggleSwitch(switches[0].id)
    updated = useAppStore.getState()
    expect(updated.lights[lights[0].id]).toBe(true)
    expect(updated.lights[lights[1].id]).toBe(false)

    // Toggle both switches: sum false, carry true
    useAppStore.getState().toggleSwitch(switches[1].id)
    updated = useAppStore.getState()
    expect(updated.lights[lights[0].id]).toBe(false)
    expect(updated.lights[lights[1].id]).toBe(true)
  })
})
