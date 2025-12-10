import { describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'

function findGroupPort(groupId: string, internalPortId: string) {
  const group = useAppStore.getState().circuit.nodes.find((n) => n.id === groupId && n.type === 'group')
  if (!group || group.type !== 'group') throw new Error('Group not found')
  const entry = Object.entries(group.data.portMap.inputs).find(([, port]) => port === internalPortId)
  if (entry) return entry[0]
  const outEntry = Object.entries(group.data.portMap.outputs).find(([, port]) => port === internalPortId)
  if (outEntry) return outEntry[0]
  throw new Error('Port mapping missing')
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

    // map group ports
    const xorNode = state.circuit.nodes.find(
      (n): n is typeof n & { type: 'gate' } =>
        n.type === 'gate' && n.groupId === activeGroup.id && n.data.gateType === 'XOR',
    )!
    const andNode = state.circuit.nodes.find(
      (n): n is typeof n & { type: 'gate' } =>
        n.type === 'gate' && n.groupId === activeGroup.id && n.data.gateType === 'AND',
    )!
    const groupInputA = findGroupPort(activeGroup.id, xorNode.data.inputPortIds[0])
    const groupInputB = findGroupPort(activeGroup.id, xorNode.data.inputPortIds[1])
    const groupCarryInputA = findGroupPort(activeGroup.id, andNode.data.inputPortIds[0])
    const groupCarryInputB = findGroupPort(activeGroup.id, andNode.data.inputPortIds[1])
    const groupSumOutput = findGroupPort(activeGroup.id, xorNode.data.outputPortId)
    const groupCarryOutput = findGroupPort(activeGroup.id, andNode.data.outputPortId)

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
      source: switches[0].id,
      target: activeGroup.id,
      sourceHandle: switches[0].data.outputPortId,
      targetHandle: groupCarryInputA,
    })
    connect({
      source: switches[1].id,
      target: activeGroup.id,
      sourceHandle: switches[1].data.outputPortId,
      targetHandle: groupCarryInputB,
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
