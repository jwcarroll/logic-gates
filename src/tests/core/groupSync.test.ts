import { describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'

describe('[US3] group open/close sync', () => {
  it('persists edits made inside group to parent circuit', () => {
    const store = useAppStore.getState()
    store.reset()
    store.addGate('AND')
    store.addGate('XOR')

    const nodes = useAppStore.getState().circuit.nodes
    const a = nodes.find((n) => n.type === 'gate' && n.data.gateType === 'AND')!
    const b = nodes.find((n) => n.type === 'gate' && n.data.gateType === 'XOR')!

    store.selectNodes([a.id, b.id])
    const grouped = store.groupSelection('My Group', [a.id, b.id])
    expect(grouped.ok).toBe(true)

    const currentDraft = useAppStore.getState().groupInterfaceDraft
    expect(currentDraft).not.toBeNull()
    useAppStore.setState({
      groupInterfaceDraft: currentDraft
        ? {
            ...currentDraft,
            interfaceDraft: {
              inputs: [],
              outputs: [{ id: 'out-y', kind: 'output', name: 'Y', mapsToInternalPortId: a.data.outputPortId }],
            },
            errors: [],
          }
        : null,
    })

    const confirm = store.confirmGroupInterfaceDraft()
    expect(confirm.ok).toBe(true)

    const groupNode = useAppStore.getState().circuit.nodes.find((n) => n.type === 'group')!
    store.openGroup(groupNode.id)
    expect(useAppStore.getState().openGroupId).toBe(groupNode.id)

    const afterGroup = useAppStore.getState().circuit.nodes
    const childA = afterGroup.find((n) => n.id === a.id)!
    const childB = afterGroup.find((n) => n.id === b.id)!
    expect(childA.groupId).toBe(groupNode.id)
    expect(childB.groupId).toBe(groupNode.id)

    const ok = store.connectWire({
      source: childA.id,
      target: childB.id,
      sourceHandle: (childA as any).data.outputPortId,
      targetHandle: (childB as any).data.inputPortIds[0],
    })
    expect(ok).toBe(true)

    store.closeGroup()
    expect(useAppStore.getState().openGroupId).toBe(null)
    expect(useAppStore.getState().selectedNodeIds).toEqual([groupNode.id])

    const wires = useAppStore.getState().circuit.wires
    expect(wires.some((w) => w.sourceNode === childA.id && w.targetNode === childB.id)).toBe(true)
  })
})
