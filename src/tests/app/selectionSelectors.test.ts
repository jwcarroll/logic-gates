import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'
import { selectSelectionState } from '../../app/store/workspaceSelectors'

describe('selection selectors', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('includes selected wire ids from the store', () => {
    const store = useAppStore.getState()
    store.addHalfAdderTemplate()

    store.addSwitch()
    const circuit = useAppStore.getState().circuit
    const groupId = circuit.nodes.find((n) => n.type === 'group')!.id
    const switchId = circuit.nodes.find((n) => n.type === 'switch')!.id
    const wireId = circuit.wires[0]!.id

    store.selectNodes([switchId, groupId])
    store.selectWires([wireId])

    const selection = selectSelectionState(useAppStore.getState())
    expect(selection.selectedNodes).toEqual([switchId])
    expect(selection.selectedGroups).toEqual([groupId])
    expect(selection.selectedWires).toEqual([wireId])
    expect(selection.focusId).toBe(switchId)
  })
})

