import { memo, useEffect, useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, applyNodeChanges } from 'reactflow'
import type { Connection, Edge, EdgeTypes, Node, NodeTypes, NodeChange, NodeMouseHandler } from 'reactflow'
import 'reactflow/dist/style.css'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../app/store'
import { toReactFlowEdges, toReactFlowNodes } from '../../app/reactFlowAdapter'
import { LogicNode } from './LogicNode'
import { useSimulationSync } from '../hooks/useSimulationSync'
import { workspaceTokens } from '../../design/tokens/workspace'
import type { CSSProperties } from 'react'
import { useSelectionStyles } from '../../app/hooks/useSelectionStyles'
import { useEnergizedWires } from '../../app/hooks/useEnergizedWires'
import { EnergizedWireOverlay } from './EnergizedWireOverlay'
import { selectSelectionState } from '../../app/store/workspaceSelectors'
import { workspacePerformance } from '../../app/perf/workspacePerformance'

const nodeTypes: NodeTypes = {
  logicNode: LogicNode,
}

const edgeTypes: EdgeTypes = {}

type Props = {
  viewGroupId?: string | null
  onOpenGroup?: (groupId: string) => void
}

export const Canvas = memo(({ viewGroupId = null, onOpenGroup }: Props) => {
  const circuit = useAppStore((s) => s.circuit)
  const outputsRaw = useAppStore((s) => s.outputs)
  const connectWire = useAppStore((s) => s.connectWire)
  const moveNodes = useAppStore((s) => s.moveNodes)
  const toggleSwitch = useAppStore((s) => s.toggleSwitch)
  const lightsRaw = useAppStore((s) => s.lights)
  const dragState = useAppStore((s) => s.paletteDragging)
  const dropAt = useAppStore((s) => s.dropAt)
  const selectNodes = useAppStore((s) => s.selectNodes)
  const selection = useAppStore(useShallow(selectSelectionState))
  const simulationUpdatedAt = useAppStore((s) => s.simulationUpdatedAt)
  const [error, setError] = useState<string | null>(null)
  const { outputs, lights } = useSimulationSync(outputsRaw, lightsRaw)
  const theme = 'dark'
  const selectionStyles = useSelectionStyles(theme)
  const wires = useEnergizedWires()
  const energizedVars = workspaceTokens.energized.theme[theme]
  const energizedAnimation = workspaceTokens.energized.animation

  const styleVars: CSSProperties = useMemo(
    () => ({
      ...selectionStyles.cssVars,
      '--wire-base': energizedVars.base,
      '--wire-gradient-start': energizedVars.gradient[0],
      '--wire-gradient-end': energizedVars.gradient[1],
      '--wire-inactive': energizedVars.inactive,
      '--wire-flow-duration': `${energizedAnimation.durationMs}ms`,
      '--wire-dasharray': energizedAnimation.dashArray,
    }),
    [
      energizedAnimation.dashArray,
      energizedAnimation.durationMs,
      energizedVars.base,
      energizedVars.gradient,
      energizedVars.inactive,
      selectionStyles.cssVars,
    ],
  )

  useEffect(() => {
    workspacePerformance.markStart('select')
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb: FrameRequestCallback) => window.setTimeout(cb, 0)
    const caf = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : (id: number) => window.clearTimeout(id)
    const id = raf(() => {
      workspacePerformance.markEndThrottled('select', 250, { budgetMs: workspaceTokens.selection.latencyBudgetMs })
    })
    return () => caf(id)
  }, [selection.updatedAt])

  useEffect(() => {
    workspacePerformance.markStart('energized-style')
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb: FrameRequestCallback) => window.setTimeout(cb, 0)
    const caf = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : (id: number) => window.clearTimeout(id)
    const id = raf(() => {
      workspacePerformance.markEndThrottled('energized-style', energizedAnimation.throttleMs, { budgetMs: 100 })
    })
    return () => caf(id)
  }, [energizedAnimation.throttleMs, simulationUpdatedAt])

  const selectedSet = useMemo(() => new Set([...selection.selectedNodes, ...selection.selectedGroups]), [selection.selectedGroups, selection.selectedNodes])

  const nodes = useMemo<Node[]>(() => {
    const base = toReactFlowNodes(circuit, outputs, lights, { onToggleSwitch: toggleSwitch }, { groupId: viewGroupId })
    return base.map((node) => ({ ...node, selected: selectedSet.has(node.id) }))
  }, [circuit, lights, outputs, selectedSet, toggleSwitch, viewGroupId])

  const wireById = useMemo(() => new Map(wires.map((wire) => [wire.wireId, wire])), [wires])

  const edges = useMemo<Edge[]>(() => {
    const base = toReactFlowEdges(circuit, { groupId: viewGroupId })
    return base.map((edge) => {
      const view = wireById.get(edge.id)
      const energized = view?.energized ?? false
      const reverse = view?.direction === 'reverse'
      const className = `workspace-wire${energized ? ' workspace-wire--energized' : ''}${reverse ? ' workspace-wire--reverse' : ''}`
      return { ...edge, className }
    })
  }, [circuit, viewGroupId, wireById])

  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return
    const ok = connectWire(connection)
    if (!ok) setError('Invalid connection (output → input, one wire per input, no self-loops).')
    else setError(null)
  }

  const handleNodesChange = (changes: NodeChange[]) => {
    moveNodes(changes)
    applyNodeChanges(changes, nodes)
  }

  const handleDrop: React.DragEventHandler = (event) => {
    event.preventDefault()
    const bounds = (event.target as HTMLElement).getBoundingClientRect()
    const position = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    dropAt(position)
  }

  const handleDragOver: React.DragEventHandler = (event) => {
    if (dragState?.type) {
      event.preventDefault()
    }
  }

  const handleNodeClick: NodeMouseHandler = (event, node) => {
    event.stopPropagation()
    const multi = event.shiftKey || event.metaKey || event.ctrlKey
    selectNodes((prev) => {
      if (multi) {
        return Array.from(new Set([...prev, node.id]))
      }
      return [node.id]
    })
  }

  const handleNodeDoubleClick: NodeMouseHandler = (_event, node) => {
    if (viewGroupId) return
    if (node.data?.kind === 'group') {
      onOpenGroup?.(node.id)
    }
  }

  const selectedCount = selection.selectedNodes.length + selection.selectedGroups.length + selection.selectedWires.length

  return (
    <div className="canvas-root" style={styleVars} onDrop={handleDrop} onDragOver={handleDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={() => undefined}
        onConnect={handleConnect}
        selectionOnDrag
        elementsSelectable
        selectNodesOnDrag
        multiSelectionKeyCode="Shift"
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={20} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
      <EnergizedWireOverlay wires={wires} theme={theme} />
      {error ? (
        <div className="canvas-error" role="status">
          {error}
        </div>
      ) : null}
      <div className="canvas-selection-indicator">
        {selectedCount ? `${selectedCount} selected` : 'Click to select; Shift+drag to multi-select'}
      </div>
    </div>
  )
})
