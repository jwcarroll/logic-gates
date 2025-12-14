import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Canvas } from '../../ui/components/Canvas'
import { useAppStore } from '../../app/store'

vi.mock('reactflow', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="reactflow">{props.children}</div>,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  applyNodeChanges: vi.fn(),
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

vi.mock('../components/EnergizedWireOverlay', () => ({
  EnergizedWireOverlay: () => null,
}))

describe('Canvas interactions', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  afterEach(() => {
    useAppStore.getState().reset()
  })

  it('renders and wires nodes through connect handler', async () => {
    render(<Canvas />)

    await act(async () => {
      const store = useAppStore.getState()
      store.addSwitch()
      store.addGate('AND')
      store.addLight()
      const nodes = useAppStore.getState().circuit.nodes
      const sw = nodes.find((n) => n.type === 'switch')!
      const gate = nodes.find((n) => n.type === 'gate')!
      const light = nodes.find((n) => n.type === 'light')!
      const connectWire = useAppStore.getState().connectWire
      connectWire({
        source: sw.id,
        target: gate.id,
        sourceHandle: sw.data.outputPortId,
        targetHandle: gate.data.inputPortIds[0],
      })
      connectWire({
        source: gate.id,
        target: light.id,
        sourceHandle: gate.data.outputPortId,
        targetHandle: light.data.inputPortId,
      })
    })

    const circuit = useAppStore.getState().circuit
    expect(circuit.wires).toHaveLength(2)
    expect(circuit.wires[0].source).toBe(circuit.nodes.find((n) => n.type === 'switch')!.data.outputPortId)
    expect(circuit.wires[1].target).toBe(circuit.nodes.find((n) => n.type === 'light')!.data.inputPortId)
  })
})
