import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'

describe('deleteSelection undo/redo', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('undo restores deleted items and both node + wire selection', () => {
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

    expect(store.deleteSelection()).toBe(true)
    expect(useAppStore.getState().circuit.wires).toHaveLength(0)

    expect(store.undo()).toBe(true)
    const afterUndo = useAppStore.getState()
    expect(afterUndo.circuit.nodes).toHaveLength(2)
    expect(afterUndo.circuit.wires.map((w) => w.id)).toEqual([wireId])
    expect(afterUndo.selectedNodeIds).toEqual([light.id])
    expect(afterUndo.selectedWireIds).toEqual([wireId])

    expect(store.redo()).toBe(true)
    const afterRedo = useAppStore.getState()
    expect(afterRedo.circuit.nodes).toHaveLength(1)
    expect(afterRedo.circuit.wires).toHaveLength(0)
    expect(afterRedo.selectedNodeIds).toEqual([])
    expect(afterRedo.selectedWireIds).toEqual([])
  })
})

