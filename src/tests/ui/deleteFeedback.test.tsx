import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../app/store'
import { Canvas } from '../../ui/components/Canvas'
import { Toolbar } from '../../ui/components/Toolbar'

vi.mock('reactflow', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="reactflow">{props.children}</div>,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  applyNodeChanges: vi.fn(),
  useStoreApi: () => ({
    setState: vi.fn(),
    getState: () => ({}),
    subscribe: () => () => {},
    destroy: () => {},
  }),
}))

vi.mock('../../app/hooks/useSelectionStyles', () => ({
  useSelectionStyles: () => ({
    stroke: '#22c55e',
    strokeWidth: 3,
    halo: '#22c55e33',
    fill: '#22c55e11',
    vectorEffect: 'non-scaling-stroke' as const,
    cssVars: {},
  }),
}))

vi.mock('../../app/hooks/useEnergizedWires', () => ({
  useEnergizedWires: () => [],
}))

vi.mock('../../ui/components/EnergizedWireOverlay', () => ({
  EnergizedWireOverlay: () => null,
}))

describe('delete UI feedback', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('clears selection indicator and disables delete after deletion', async () => {
    render(
      <>
        <Toolbar />
        <Canvas />
      </>,
    )

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

    expect(screen.getByText('2 selected')).toBeInTheDocument()

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    expect(deleteButton).not.toBeDisabled()
    fireEvent.click(deleteButton)

    expect(screen.getByText('Click to select; Shift+drag to multi-select')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()
    expect(useAppStore.getState().circuit.wires).toHaveLength(0)
  })
})
