import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'

describe('undo/redo group interface edits', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('undo restores wires and interface after an interface edit disconnects wires', () => {
    const store = useAppStore.getState()

    // Create a grouped half-adder (group contains junctions + explicit interface).
    store.addHalfAdderTemplate()

    const initial = useAppStore.getState().circuit
    const group = initial.nodes.find((n) => n.type === 'group')!
    const [inA, inB] = group.data.interface.inputs
    const [outSum, outCarry] = group.data.interface.outputs

    // Add external IO to wire the group.
    store.addSwitch()
    store.addSwitch()
    store.addLight()
    store.addLight()

    const circuit = useAppStore.getState().circuit
    const switches = circuit.nodes.filter((n) => n.type === 'switch')
    const lights = circuit.nodes.filter((n) => n.type === 'light')

    store.connectWire({ source: switches[0].id, sourceHandle: switches[0].data.outputPortId, target: group.id, targetHandle: inA.id })
    store.connectWire({ source: switches[1].id, sourceHandle: switches[1].data.outputPortId, target: group.id, targetHandle: inB.id })
    store.connectWire({ source: group.id, sourceHandle: outSum.id, target: lights[0].id, targetHandle: lights[0].data.inputPortId })
    store.connectWire({ source: group.id, sourceHandle: outCarry.id, target: lights[1].id, targetHandle: lights[1].data.inputPortId })

    const wired = useAppStore.getState().circuit
    const externalNodeIds = new Set([group.id, switches[0].id, switches[1].id, lights[0].id, lights[1].id])
    const externalWireIdsBefore = wired.wires
      .filter((w) => externalNodeIds.has(w.sourceNode) || externalNodeIds.has(w.targetNode))
      .map((w) => w.id)
    expect(externalWireIdsBefore).toHaveLength(4)

    // Edit interface: rename a port; confirm disconnect behavior.
    store.selectNodes([group.id])
    expect(store.editSelectedGroupInterface().ok).toBe(true)
    const draft = useAppStore.getState().groupInterfaceDraft
    expect(draft?.mode).toBe('edit')

    useAppStore.setState({
      groupInterfaceDraft: {
        ...(draft as any),
        interfaceDraft: {
          ...draft!.interfaceDraft,
          inputs: [{ ...draft!.interfaceDraft.inputs[0], name: 'A2' }, ...draft!.interfaceDraft.inputs.slice(1)],
        },
        errors: [],
      },
    })

    const confirm = store.confirmGroupInterfaceDraft()
    expect(confirm.ok).toBe(true)

    const afterEdit = useAppStore.getState().circuit
    expect(afterEdit.wires.filter((w) => externalNodeIds.has(w.sourceNode) || externalNodeIds.has(w.targetNode))).toHaveLength(0)
    const groupAfter = afterEdit.nodes.find((n) => n.type === 'group' && n.id === group.id)!
    expect(groupAfter.data.interface.inputs[0].name).toBe('A2')

    // Undo restores both the wiring and the previous interface.
    expect(store.undo()).toBe(true)
    const afterUndo = useAppStore.getState().circuit
    const externalWireIdsAfterUndo = afterUndo.wires
      .filter((w) => externalNodeIds.has(w.sourceNode) || externalNodeIds.has(w.targetNode))
      .map((w) => w.id)
    expect(externalWireIdsAfterUndo).toEqual(externalWireIdsBefore)
    const groupAfterUndo = afterUndo.nodes.find((n) => n.type === 'group' && n.id === group.id)!
    expect(groupAfterUndo.data.interface.inputs[0].name).toBe(inA.name)
  })
})
