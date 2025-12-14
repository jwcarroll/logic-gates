import { workspaceTokens } from '../../design/tokens/workspace'
import { useAppStore } from './index'
import type { CircuitNode } from '../../core/types'

export type StoreState = ReturnType<typeof useAppStore.getState>

export type CanvasSize = {
  viewportWidth: number
  viewportHeight: number
  meetsMinWidth: boolean
  padding: number
}

export type SelectionState = {
  selectedNodes: string[]
  selectedGroups: string[]
  selectedWires: string[]
  focusId: string | null
  updatedAt: number
}

export type WireViewState = {
  wireId: string
  energized: boolean
  direction: 'forward' | 'reverse' | null
  intensity: number
}

export type GroupViewState = {
  groupId: string | null
  breadcrumb: string[]
  status: 'live' | 'paused'
  isOpen: boolean
}

const nodeLookup = (nodes: CircuitNode[]) => new Map(nodes.map((n) => [n.id, n]))

const now = () => Date.now()

export const selectCanvasSize = (_state: StoreState, viewport?: { width?: number; height?: number }): CanvasSize => {
  const fallbackWidth = workspaceTokens.canvas.minWidth
  const width = viewport?.width ?? (typeof window !== 'undefined' ? window.innerWidth : fallbackWidth)
  const height = viewport?.height ?? (typeof window !== 'undefined' ? window.innerHeight : fallbackWidth)

  return {
    viewportWidth: width,
    viewportHeight: height,
    meetsMinWidth: width >= workspaceTokens.canvas.minWidth,
    padding: workspaceTokens.canvas.padding,
  }
}

export const selectSelectionState = (state: StoreState): SelectionState => {
  const lookup = nodeLookup(state.circuit.nodes)
  const selectedGroups = state.selectedNodeIds.filter((id) => lookup.get(id)?.type === 'group')
  const selectedNodes = state.selectedNodeIds.filter((id) => lookup.get(id)?.type !== 'group')

  return {
    selectedNodes,
    selectedGroups,
    selectedWires: [],
    focusId: selectedNodes[0] ?? selectedGroups[0] ?? null,
    updatedAt: now(),
  }
}

export const selectWireState = (_state: StoreState): WireViewState[] => []

export const selectGroupView = (state: StoreState): GroupViewState => {
  const lookup = nodeLookup(state.circuit.nodes)
  const firstGroup = state.selectedNodeIds.find((id) => lookup.get(id)?.type === 'group') ?? null
  return {
    groupId: firstGroup,
    breadcrumb: firstGroup ? ['Root', firstGroup] : [],
    status: 'live',
    isOpen: Boolean(firstGroup),
  }
}
