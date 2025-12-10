import { create } from 'zustand'
import { createGateNode, createLightNode, createSwitchNode } from '../core/factories'
import { addWire } from '../core/commands'
import { simulate } from '../core/simulation'
import type { Circuit, CircuitNode, GateType, Position } from '../core/types'
import type { Connection, NodeChange } from 'reactflow'

const INITIAL_POSITION: Position = { x: 100, y: 100 }

const emptyCircuit: Circuit = {
  nodes: [],
  wires: [],
}

interface AppState {
  circuit: Circuit
  outputs: Record<string, boolean>
  lights: Record<string, boolean>
  addSwitch: () => void
  addLight: () => void
  addGate: (gate: GateType) => void
  connectWire: (connection: Connection) => boolean
  moveNodes: (changes: NodeChange[]) => void
  toggleSwitch: (nodeId: string) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  circuit: emptyCircuit,
  outputs: {},
  lights: {},

  addSwitch: () =>
    set((state) => {
      const circuit = {
        ...state.circuit,
        nodes: [...state.circuit.nodes, createSwitchNode(nextPosition(state.circuit.nodes.length))],
      }
      const { outputs, lights } = simulate(circuit)
      return { circuit, outputs, lights }
    }),

  addLight: () =>
    set((state) => {
      const circuit = {
        ...state.circuit,
        nodes: [...state.circuit.nodes, createLightNode(nextPosition(state.circuit.nodes.length))],
      }
      const { outputs, lights } = simulate(circuit)
      return { circuit, outputs, lights }
    }),

  addGate: (gate) =>
    set((state) => {
      const circuit = {
        ...state.circuit,
        nodes: [...state.circuit.nodes, createGateNode(gate, nextPosition(state.circuit.nodes.length))],
      }
      const { outputs, lights } = simulate(circuit)
      return { circuit, outputs, lights }
    }),

  connectWire: (connection) => {
    const { circuit } = get()
    const result = addWire(circuit, connection)
    if (!result.ok) {
      return false
    }
    const { outputs, lights } = simulate(result.next)
    set({ circuit: result.next, outputs, lights })
    return true
  },

  moveNodes: (changes) =>
    set((state) => {
      let updated = state.circuit.nodes
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updated = updated.map((node) => (node.id === change.id ? { ...node, position: change.position! } : node))
        }
      })
      const circuit: Circuit = { ...state.circuit, nodes: updated }
      return { circuit }
    }),

  toggleSwitch: (nodeId) =>
    set((state) => {
      const nodes: CircuitNode[] = state.circuit.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'switch') {
          return {
            ...node,
            data: { ...node.data, state: !node.data.state },
          }
        }
        return node
      })
      const circuit: Circuit = { ...state.circuit, nodes }
      const { outputs, lights } = simulate(circuit)
      return { circuit, outputs, lights }
    }),

  reset: () => set({ circuit: emptyCircuit, outputs: {}, lights: {} }),
}))

function nextPosition(index: number): Position {
  const offset = 50
  return { x: INITIAL_POSITION.x + index * offset, y: INITIAL_POSITION.y + index * offset }
}
