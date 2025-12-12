import '@testing-library/jest-dom/vitest'

// React Flow relies on ResizeObserver; provide a minimal jsdom-friendly stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error jsdom global augmentation for tests
global.ResizeObserver = global.ResizeObserver ?? ResizeObserverStub
