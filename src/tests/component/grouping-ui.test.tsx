import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { useAppStore } from '../../app/store'

vi.mock('reactflow', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="reactflow">{props.children}</div>,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  applyNodeChanges: vi.fn(),
}))

vi.mock('../../ui/WorkspaceShell', () => ({
  WorkspaceShell: () => <div data-testid="workspace-shell-mock" />,
}))

vi.mock('../../ui/components/EnergizedWireOverlay', () => ({
  EnergizedWireOverlay: () => null,
}))

describe('Grouping UI', () => {
  beforeEach(() => {
    act(() => {
      useAppStore.getState().reset()
    })
  })

  afterEach(() => {
    act(() => {
      useAppStore.getState().reset()
    })
  })

  it('groups selected nodes and clones the group', async () => {
    render(<App />)
    let nodeIds: string[] = []
    await act(async () => {
      const store = useAppStore.getState()
      store.addGate('AND')
      store.addGate('XOR')
      const current = useAppStore.getState()
      nodeIds = current.circuit.nodes.map((n) => n.id)
      useAppStore.setState({ selectedNodeIds: nodeIds })
    })

    expect(useAppStore.getState().circuit.nodes.length).toBeGreaterThan(0)
    const result = useAppStore.getState().groupSelection('Group', nodeIds)
    expect(result.ok).toBe(true)

    const afterGroup = useAppStore.getState()
    const groups = afterGroup.circuit.nodes.filter((n) => n.type === 'group')
    expect(groups).toHaveLength(1)
    const group = groups[0]
    expect(group.data.inputPortIds.length).toBeGreaterThan(0)
    expect(group.data.outputPortIds.length).toBeGreaterThan(0)

    await act(async () => {
      useAppStore.getState().selectNodes([group.id])
      useAppStore.getState().cloneSelectedGroup()
    })

    const afterClone = useAppStore.getState()
    expect(afterClone.circuit.nodes.filter((n) => n.type === 'group')).toHaveLength(2)
  })

  it('places a half-adder subcircuit from the catalog button', async () => {
    render(<App />)
    await act(async () => {
      const buttons = screen.getAllByRole('button', { name: /half-adder subcircuit/i })
      fireEvent.click(buttons[0])
    })
    const circuit = useAppStore.getState().circuit
    const halfAdder = circuit.nodes.find((n) => n.type === 'group' && n.data.label === 'Half Adder')
    expect(halfAdder).toBeDefined()
    expect((halfAdder as any).data.outputPortIds.length).toBeGreaterThan(0)
  })
})
