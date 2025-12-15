import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../app/store'
import { Canvas } from '../../ui/components/Canvas'

const setState = vi.fn()

vi.mock('reactflow', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="reactflow">{props.children}</div>,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  applyNodeChanges: vi.fn(),
  useStoreApi: () => ({
    setState,
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

describe('delete during interaction', () => {
  beforeEach(() => {
    setState.mockClear()
    useAppStore.getState().reset()
  })

  it('resets reactflow connection/selection interaction state when delete is invoked', async () => {
    render(<Canvas />)

    const initialCalls = setState.mock.calls.length
    await act(async () => {
      useAppStore.getState().deleteSelection()
    })

    expect(setState.mock.calls.length).toBeGreaterThan(initialCalls)
    const lastArg = setState.mock.calls[setState.mock.calls.length - 1]?.[0]
    expect(lastArg).toMatchObject({
      connectionNodeId: null,
      connectionHandleId: null,
      connectionHandleType: null,
      connectionStatus: null,
    })
  })
})

