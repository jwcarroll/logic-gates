import { memo, useMemo } from 'react'
import ReactFlow, { Background, Controls, MiniMap, applyNodeChanges } from 'reactflow'
import type { Connection, Edge, EdgeTypes, Node, NodeTypes, NodeChange } from 'reactflow'
import 'reactflow/dist/style.css'
import { useAppStore } from '../../app/store'
import { toReactFlowEdges, toReactFlowNodes } from '../../app/reactFlowAdapter'
import { LogicNode } from './LogicNode'

const nodeTypes: NodeTypes = {
  logicNode: LogicNode,
}

const edgeTypes: EdgeTypes = {}

export const Canvas = memo(() => {
  const circuit = useAppStore((s) => s.circuit)
  const outputs = useAppStore((s) => s.outputs)
  const connectWire = useAppStore((s) => s.connectWire)
  const moveNodes = useAppStore((s) => s.moveNodes)
  const toggleSwitch = useAppStore((s) => s.toggleSwitch)
  const lights = useAppStore((s) => s.lights)

  const nodes = useMemo<Node[]>(() => toReactFlowNodes(circuit, outputs, lights, { onToggleSwitch: toggleSwitch }), [circuit, outputs, lights, toggleSwitch])
  const edges = useMemo<Edge[]>(() => toReactFlowEdges(circuit), [circuit])

  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return
    connectWire(connection)
  }

  const handleNodesChange = (changes: NodeChange[]) => {
    moveNodes(changes)
    applyNodeChanges(changes, nodes)
  }

  return (
    <div className="canvas-root">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={() => undefined}
        onConnect={handleConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={20} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  )
})
