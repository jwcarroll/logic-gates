import { memo, useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, applyNodeChanges } from 'reactflow'
import type { Connection, Edge, EdgeTypes, Node, NodeTypes, NodeChange, NodeMouseHandler } from 'reactflow'
import 'reactflow/dist/style.css'
import { useAppStore } from '../../app/store'
import { toReactFlowEdges, toReactFlowNodes } from '../../app/reactFlowAdapter'
import { LogicNode } from './LogicNode'
import { useSimulationSync } from '../hooks/useSimulationSync'

const nodeTypes: NodeTypes = {
  logicNode: LogicNode,
}

const edgeTypes: EdgeTypes = {}

export const Canvas = memo(() => {
  const circuit = useAppStore((s) => s.circuit)
  const outputsRaw = useAppStore((s) => s.outputs)
  const connectWire = useAppStore((s) => s.connectWire)
  const moveNodes = useAppStore((s) => s.moveNodes)
  const toggleSwitch = useAppStore((s) => s.toggleSwitch)
  const lightsRaw = useAppStore((s) => s.lights)
  const dragState = useAppStore((s) => s.paletteDragging)
  const dropAt = useAppStore((s) => s.dropAt)
  const selectNodes = useAppStore((s) => s.selectNodes)
  const selectedIds = useAppStore((s) => s.selectedNodeIds)
  const [error, setError] = useState<string | null>(null)
  const { outputs, lights } = useSimulationSync(outputsRaw, lightsRaw)
  const energizedWireState: [] = []

  const nodes = useMemo<Node[]>(() => toReactFlowNodes(circuit, outputs, lights, { onToggleSwitch: toggleSwitch }), [circuit, outputs, lights, toggleSwitch])
  const edges = useMemo<Edge[]>(() => toReactFlowEdges(circuit), [circuit])

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

  return (
    <div className="canvas-root" onDrop={handleDrop} onDragOver={handleDragOver}>
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
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={20} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
      <div className="energized-overlay" data-testid="energized-overlay" />
      {error ? (
        <div className="canvas-error" role="status">
          {error}
        </div>
      ) : null}
      <div className="canvas-selection-indicator">{selectedIds.length ? `${selectedIds.length} selected` : 'Click to select; Shift+drag to multi-select'}</div>
    </div>
  )
})
