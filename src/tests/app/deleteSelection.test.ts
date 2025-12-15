import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'

describe('deleteSelection (store)', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('applies core deletion, clears selection, and pushes history', () => {
    const store = useAppStore.getState()

    store.addSwitch()
    store.addLight()
    const circuit = useAppStore.getState().circuit
    const sw = circuit.nodes.find((n) => n.type === 'switch')!
    const light = circuit.nodes.find((n) => n.type === 'light')!

    store.connectWire({ source: sw.id, sourceHandle: sw.data.outputPortId, target: light.id, targetHandle: light.data.inputPortId })
    const wireId = useAppStore.getState().circuit.wires[0]!.id

    store.selectNodes([light.id])
    store.selectWires([wireId])
    const historyBefore = useAppStore.getState().history.past.length

    expect(store.deleteSelection()).toBe(true)

    const after = useAppStore.getState()
    expect(after.circuit.nodes.map((n) => n.id)).toEqual([sw.id])
    expect(after.circuit.wires).toHaveLength(0)
    expect(after.selectedNodeIds).toEqual([])
    expect(after.selectedWireIds).toEqual([])
    expect(after.history.past.length).toBe(historyBefore + 1)
  })

  it('is a no-op when nothing is selected', () => {
    const store = useAppStore.getState()
    const historyBefore = useAppStore.getState().history.past.length

    expect(store.deleteSelection()).toBe(false)

    const after = useAppStore.getState()
    expect(after.selectedNodeIds).toEqual([])
    expect(after.selectedWireIds).toEqual([])
    expect(after.history.past.length).toBe(historyBefore)
  })

  it('deletes a mixed multi-selection (nodes + wires) in one action', () => {
    const store = useAppStore.getState()

    store.addSwitch()
    store.addLight()
    const circuit = useAppStore.getState().circuit
    const sw = circuit.nodes.find((n) => n.type === 'switch')!
    const light = circuit.nodes.find((n) => n.type === 'light')!

    store.connectWire({ source: sw.id, sourceHandle: sw.data.outputPortId, target: light.id, targetHandle: light.data.inputPortId })
    const wireId = useAppStore.getState().circuit.wires[0]!.id

    store.selectNodes([sw.id, light.id])
    store.selectWires([wireId])

    expect(store.deleteSelection()).toBe(true)
    expect(useAppStore.getState().circuit.nodes).toHaveLength(0)
    expect(useAppStore.getState().circuit.wires).toHaveLength(0)
    expect(useAppStore.getState().selectedNodeIds).toEqual([])
    expect(useAppStore.getState().selectedWireIds).toEqual([])
  })
})
