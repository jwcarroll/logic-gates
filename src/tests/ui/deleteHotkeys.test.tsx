import { act, fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceShell } from '../../ui/WorkspaceShell'
import { useAppStore } from '../../app/store'

vi.mock('../../ui/WorkspaceCanvas', () => ({
  WorkspaceCanvas: () => null,
}))

describe('delete hotkeys', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('deletes selection on Delete/Backspace when not typing', async () => {
    render(<WorkspaceShell />)

    await act(async () => {
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
    })

    fireEvent.keyDown(window, { key: 'Delete' })

    const after = useAppStore.getState()
    expect(after.circuit.nodes).toHaveLength(1)
    expect(after.circuit.wires).toHaveLength(0)
    expect(after.selectedNodeIds).toEqual([])
    expect(after.selectedWireIds).toEqual([])
  })

  it('does not delete when typing in an input', async () => {
    render(<WorkspaceShell />)

    await act(async () => {
      const store = useAppStore.getState()
      store.addSwitch()
      store.addLight()
      const circuit = useAppStore.getState().circuit
      const sw = circuit.nodes.find((n) => n.type === 'switch')!
      const light = circuit.nodes.find((n) => n.type === 'light')!
      store.connectWire({ source: sw.id, sourceHandle: sw.data.outputPortId, target: light.id, targetHandle: light.data.inputPortId })
      store.selectNodes([light.id])
    })

    const before = useAppStore.getState().circuit
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    fireEvent.keyDown(input, { key: 'Backspace' })

    input.remove()

    const after = useAppStore.getState().circuit
    expect(after.nodes.map((n) => n.id)).toEqual(before.nodes.map((n) => n.id))
    expect(after.wires.map((w) => w.id)).toEqual(before.wires.map((w) => w.id))
  })
})
