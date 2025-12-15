import '@testing-library/jest-dom/vitest'
import React from 'react'
import { vi } from 'vitest'

// Mock reactflow to avoid internal Zustand loops in jsdom unit tests.
vi.mock('reactflow', () => {
  const MockFlow = ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'reactflow-mock' }, children)
  return {
    __esModule: true,
    default: MockFlow,
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
  }
})

// React Flow relies on ResizeObserver; provide a minimal jsdom-friendly stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error jsdom global augmentation for tests
global.ResizeObserver = global.ResizeObserver ?? ResizeObserverStub
