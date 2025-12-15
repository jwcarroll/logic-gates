import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'

describe('[US3] delete + undo journey', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('deletes a selected node, clears selection, and undo restores items and selection', () => {
    const store = useAppStore.getState()

    store.addSwitch()
    store.addGate('AND')
    store.addLight()

    const circuit = useAppStore.getState().circuit
    const sw = circuit.nodes.find((n) => n.type === 'switch')!
    const gate = circuit.nodes.find((n) => n.type === 'gate')!
    const light = circuit.nodes.find((n) => n.type === 'light')!

    store.connectWire({ source: sw.id, sourceHandle: sw.data.outputPortId, target: gate.id, targetHandle: gate.data.inputPortIds[0] })
    store.connectWire({ source: gate.id, sourceHandle: gate.data.outputPortId, target: light.id, targetHandle: light.data.inputPortId })

    store.selectNodes([gate.id])
    expect(store.deleteSelection()).toBe(true)

    expect(useAppStore.getState().selectedNodeIds).toEqual([])
    expect(useAppStore.getState().selectedWireIds).toEqual([])
    expect(useAppStore.getState().circuit.nodes.some((n) => n.id === gate.id)).toBe(false)
    expect(useAppStore.getState().circuit.wires.some((w) => w.sourceNode === gate.id || w.targetNode === gate.id)).toBe(false)

    expect(store.undo()).toBe(true)
    const afterUndo = useAppStore.getState()
    expect(afterUndo.circuit.nodes.some((n) => n.id === gate.id)).toBe(true)
    expect(afterUndo.selectedNodeIds).toEqual([gate.id])
  })
})

