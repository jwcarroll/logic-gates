import type { Circuit } from '../../core/types'

export type HistorySnapshot = {
  circuit: Circuit
  selectedNodeIds: string[]
  openGroupId: string | null
}

export type HistoryState = {
  past: HistorySnapshot[]
  future: HistorySnapshot[]
}

export function createEmptyHistory(): HistoryState {
  return { past: [], future: [] }
}

export function pushHistory(history: HistoryState, snapshot: HistorySnapshot, limit = 50): HistoryState {
  const past = [...history.past, snapshot]
  const trimmedPast = past.length > limit ? past.slice(past.length - limit) : past
  return { past: trimmedPast, future: [] }
}

export function undoHistory(
  history: HistoryState,
  current: HistorySnapshot,
): { history: HistoryState; snapshot: HistorySnapshot } | null {
  if (history.past.length === 0) return null
  const snapshot = history.past[history.past.length - 1]
  const past = history.past.slice(0, -1)
  const future = [current, ...history.future]
  return { history: { past, future }, snapshot }
}

export function redoHistory(
  history: HistoryState,
  current: HistorySnapshot,
): { history: HistoryState; snapshot: HistorySnapshot } | null {
  if (history.future.length === 0) return null
  const snapshot = history.future[0]
  const future = history.future.slice(1)
  const past = [...history.past, current]
  return { history: { past, future }, snapshot }
}
