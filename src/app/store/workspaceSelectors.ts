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

let lastSelectionInput:
  | {
      nodes: CircuitNode[]
      selectedNodeIds: string[]
      selectedWireIds: string[]
      selectionUpdatedAt: number
    }
  | undefined
let lastSelectionOutput: SelectionState | undefined

export const selectSelectionState = (state: StoreState): SelectionState => {
  if (
    lastSelectionInput?.nodes === state.circuit.nodes &&
    lastSelectionInput?.selectedNodeIds === state.selectedNodeIds &&
    lastSelectionInput?.selectedWireIds === state.selectedWireIds &&
    lastSelectionInput?.selectionUpdatedAt === state.selectionUpdatedAt &&
    lastSelectionOutput
  ) {
    return lastSelectionOutput
  }

  const lookup = nodeLookup(state.circuit.nodes)
  const selectedGroups = state.selectedNodeIds.filter((id) => lookup.get(id)?.type === 'group')
  const selectedNodes = state.selectedNodeIds.filter((id) => lookup.get(id)?.type !== 'group')

  const next: SelectionState = {
    selectedNodes,
    selectedGroups,
    selectedWires: state.selectedWireIds,
    focusId: selectedNodes[0] ?? selectedGroups[0] ?? null,
    updatedAt: state.selectionUpdatedAt,
  }

  lastSelectionInput = {
    nodes: state.circuit.nodes,
    selectedNodeIds: state.selectedNodeIds,
    selectedWireIds: state.selectedWireIds,
    selectionUpdatedAt: state.selectionUpdatedAt,
  }
  lastSelectionOutput = next
  return next
}

let lastWireInput:
  | {
      wires: StoreState['circuit']['wires']
      outputs: StoreState['outputs']
    }
  | undefined
let lastWireOutput: WireViewState[] | undefined

export const selectWireState = (state: StoreState): WireViewState[] => {
  if (lastWireInput?.wires === state.circuit.wires && lastWireInput?.outputs === state.outputs && lastWireOutput) {
    return lastWireOutput
  }

  const { circuit, outputs } = state
  const next: WireViewState[] = circuit.wires.map((wire) => {
    const energized = Boolean(outputs[wire.source])
    return {
      wireId: wire.id,
      energized,
      direction: energized ? 'forward' : null,
      intensity: energized ? 1 : 0,
    }
  })

  lastWireInput = { wires: state.circuit.wires, outputs: state.outputs }
  lastWireOutput = next
  return next
}

let lastGroupInput:
  | {
      groupId: string | null
      nodes: CircuitNode[]
    }
  | undefined
let lastGroupOutput: GroupViewState | undefined

export const selectGroupView = (state: StoreState): GroupViewState => {
  const groupId = state.openGroupId
  if (lastGroupInput?.groupId === groupId && lastGroupInput?.nodes === state.circuit.nodes && lastGroupOutput) {
    return lastGroupOutput
  }

  const next: GroupViewState = (() => {
    if (!groupId) {
      return { groupId: null, breadcrumb: [], status: 'live', isOpen: false }
    }
    const group = state.circuit.nodes.find((n) => n.type === 'group' && n.id === groupId)
    const label = group && group.type === 'group' ? group.data.label : groupId
    return { groupId, breadcrumb: ['Root', label], status: 'live', isOpen: true }
  })()

  lastGroupInput = { groupId, nodes: state.circuit.nodes }
  lastGroupOutput = next
  return next
}
