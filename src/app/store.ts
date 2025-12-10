import { create } from 'zustand'
import { createGateNode, createLightNode, createSwitchNode } from '../core/factories'
import { cloneGroup, connect, groupNodes, ungroup } from '../core/commands'
import { simulate } from '../core/simulation'
import type { Circuit, CircuitNode, GateType, Position } from '../core/types'
import type { Connection, NodeChange } from 'reactflow'
import type { CircuitExport } from '../core/io/schema'
import { exportCircuit as buildExport, importCircuit as parseImport } from '../core/io/importExport'
import type { ChallengeTarget } from '../core/commands/challengeCommands'
import { evaluateChallenge } from '../core/commands/challengeCommands'
import { getChallengeById } from './challenges/challengeService'
import { reportGraphErrors, reportImportError } from './logging/errorReporting'

const INITIAL_POSITION: Position = { x: 100, y: 100 }

const emptyCircuit: Circuit = {
  nodes: [],
  wires: [],
}

interface AppState {
  circuit: Circuit
  outputs: Record<string, boolean>
  lights: Record<string, boolean>
  selectedNodeIds: string[]
  paletteDragging: { type: 'switch' | 'gate' | 'light' | null; gateType?: GateType } | null
  challengeStatus: {
    id?: string
    title?: string
    state: 'idle' | 'loaded' | 'success' | 'incomplete' | 'error'
    message?: string
  }
  currentChallengeTarget?: ChallengeTarget
  startDrag: (type: 'switch' | 'gate' | 'light', gateType?: GateType) => void
  cancelDrag: () => void
  dropAt: (position: Position) => void
  addSwitch: () => void
  addLight: () => void
  addGate: (gate: GateType) => void
  connectWire: (connection: Connection) => boolean
  moveNodes: (changes: NodeChange[]) => void
  selectNodes: (ids: string[] | ((prev: string[]) => string[])) => void
  groupSelection: (label?: string, nodeIds?: string[]) => { ok: boolean; errors?: string[] }
  ungroupSelection: () => { ok: boolean; errors?: string[] }
  cloneSelectedGroup: () => { ok: boolean; errors?: string[] }
  addHalfAdderTemplate: () => void
  toggleSwitch: (nodeId: string) => void
  exportCircuit: () => CircuitExport
  importCircuit: (payload: unknown) => { ok: boolean; errors?: string[] }
  loadChallenge: (challengeId: string) => { ok: boolean; errors?: string[] }
  runChallenge: () => { ok: boolean; errors?: string[] }
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  circuit: emptyCircuit,
  outputs: {},
  lights: {},
  selectedNodeIds: [],
  paletteDragging: null,
  challengeStatus: { state: 'idle' },
  currentChallengeTarget: undefined,

  startDrag: (type, gateType) => set({ paletteDragging: { type, gateType } }),
  cancelDrag: () => set({ paletteDragging: null }),
  dropAt: (position) =>
    set((state) => {
      if (!state.paletteDragging || !state.paletteDragging.type) return {}
      const type = state.paletteDragging.type
      let circuit = state.circuit
      if (type === 'switch') {
        circuit = { ...circuit, nodes: [...circuit.nodes, createSwitchNode(position)] }
      } else if (type === 'light') {
        circuit = { ...circuit, nodes: [...circuit.nodes, createLightNode(position)] }
      } else if (type === 'gate' && state.paletteDragging.gateType) {
        circuit = { ...circuit, nodes: [...circuit.nodes, createGateNode(state.paletteDragging.gateType, position)] }
      }
      const sim = simulate(circuit)
      return { circuit, outputs: sim.outputs, lights: sim.lights, paletteDragging: null }
    }),

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
    const { source, target, sourceHandle, targetHandle } = connection
    if (!source || !target || !sourceHandle || !targetHandle) return false
    const result = connect(circuit, {
      sourceNodeId: source,
      targetNodeId: target,
      sourcePortId: sourceHandle,
      targetPortId: targetHandle,
    })
    if (!result.ok || !result.value) {
      reportGraphErrors(result.errors)
      return false
    }
    const { outputs, lights } = simulate(result.value)
    set({ circuit: result.value, outputs, lights })
    return true
  },

  moveNodes: (changes) =>
    set((state) => {
      let updated = state.circuit.nodes
      let selectedIds = state.selectedNodeIds
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updated = updated.map((node) => (node.id === change.id ? { ...node, position: change.position! } : node))
        }
        if (change.type === 'select' && typeof change.selected === 'boolean') {
          selectedIds = change.selected
            ? Array.from(new Set([...selectedIds, change.id]))
            : selectedIds.filter((id) => id !== change.id)
        }
      })
      const circuit: Circuit = { ...state.circuit, nodes: updated }
      return { circuit, selectedNodeIds: selectedIds }
    }),

  selectNodes: (ids) =>
    set((state) => {
      const next = typeof ids === 'function' ? ids(state.selectedNodeIds) : ids
      const same =
        state.selectedNodeIds.length === next.length &&
        state.selectedNodeIds.every((id) => next.includes(id)) &&
        next.every((id) => state.selectedNodeIds.includes(id))
      if (same) return {}
      return { selectedNodeIds: next }
    }),

  groupSelection: (label = 'Group', nodeIds?: string[]) => {
    const state = get()
    const targets = nodeIds ?? state.selectedNodeIds
    const existingTargets = targets.filter((id) => state.circuit.nodes.some((n) => n.id === id))
    if (!existingTargets.length) return { ok: false, errors: ['No nodes selected to group'] }
    const result = groupNodes(state.circuit, { nodeIds: existingTargets, label })
    if (!result.ok || !result.value) return { ok: false, errors: result.errors }
    const sim = simulate(result.value)
    const groupId = findLatestGroupId(result.value)
    set({
      circuit: result.value,
      outputs: sim.outputs,
      lights: sim.lights,
      selectedNodeIds: groupId ? [groupId] : [],
    })
    return { ok: true }
  },

  ungroupSelection: () => {
    const state = get()
    const groupId = state.selectedNodeIds.find((id) => state.circuit.nodes.find((n) => n.id === id && n.type === 'group') !== undefined)
    if (!groupId) return { ok: false, errors: ['No group selected'] }
    const result = ungroup(state.circuit, groupId)
    if (!result.ok || !result.value) return { ok: false, errors: result.errors }
    const sim = simulate(result.value)
    set({ circuit: result.value, outputs: sim.outputs, lights: sim.lights, selectedNodeIds: [] })
    return { ok: true }
  },

  cloneSelectedGroup: () => {
    const state = get()
    const groupId = state.selectedNodeIds.find((id) => state.circuit.nodes.find((n) => n.id === id && n.type === 'group') !== undefined)
    if (!groupId) return { ok: false, errors: ['No group selected'] }
    const result = cloneGroup(state.circuit, groupId, { x: 60, y: 40 })
    if (!result.ok || !result.value) return { ok: false, errors: result.errors }
    const sim = simulate(result.value)
    set({ circuit: result.value, outputs: sim.outputs, lights: sim.lights })
    return { ok: true }
  },

  addHalfAdderTemplate: () =>
    set((state) => {
      const template = buildHalfAdderTemplate()
      const mergedNodes = [...state.circuit.nodes, ...template.nodes]
      const mergedWires = [...state.circuit.wires, ...template.wires]
      const circuit = { ...state.circuit, nodes: mergedNodes, wires: mergedWires }
      const sim = simulate(circuit)
      return { circuit, outputs: sim.outputs, lights: sim.lights }
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

  exportCircuit: () => {
    const result = buildExport(get().circuit)
    if (!result.ok || !result.value) {
      return { version: '1.1' as const, circuit: emptyCircuit }
    }
    return result.value
  },

  importCircuit: (payload) => {
    const parsed = parseImport(payload)
    if (!parsed.ok || !parsed.value) {
      reportImportError(parsed.errors)
      return { ok: false, errors: parsed.errors }
    }
    const circuit = parsed.value
    const { outputs, lights } = simulate(circuit)
    set({ circuit, outputs, lights, challengeStatus: { state: 'idle' }, currentChallengeTarget: undefined })
    return { ok: true }
  },

  loadChallenge: (challengeId) => {
    const challenge = getChallengeById(challengeId)
    if (!challenge) {
      return { ok: false, errors: ['Challenge not found'] }
    }
    const { starterCircuit, target, title } = challenge
    const { outputs, lights } = simulate(starterCircuit)
    set({
      circuit: starterCircuit,
      outputs,
      lights,
      currentChallengeTarget: target,
      challengeStatus: { id: challengeId, title, state: 'loaded', message: 'Challenge loaded. Adjust wiring and validate.' },
      selectedNodeIds: [],
    })
    return { ok: true }
  },

  runChallenge: () => {
    const target = get().currentChallengeTarget
    if (!target) {
      return { ok: false, errors: ['No challenge loaded'] }
    }
    const evaluation = evaluateChallenge(get().circuit, target)
    set({
      challengeStatus: {
        ...get().challengeStatus,
        state: evaluation.success ? 'success' : 'incomplete',
        message: evaluation.success ? 'Success criteria met!' : evaluation.details.join('; '),
      },
    })
    return { ok: evaluation.success, errors: evaluation.success ? undefined : evaluation.details }
  },

  reset: () =>
    set({
      circuit: emptyCircuit,
      outputs: {},
      lights: {},
      selectedNodeIds: [],
      paletteDragging: null,
      challengeStatus: { state: 'idle' },
      currentChallengeTarget: undefined,
    }),
}))

if (typeof window !== 'undefined') {
  // Expose store for Playwright/browser E2E hooks
  ;(window as any).__APP_STORE__ = useAppStore
}

function findLatestGroupId(circuit: Circuit): string {
  const groups = circuit.nodes.filter((n) => n.type === 'group')
  return groups.length ? groups[groups.length - 1].id : ''
}

function buildHalfAdderTemplate(): Circuit {
  const xorGate = createGateNode('XOR', { x: 100, y: 100 })
  const andGate = createGateNode('AND', { x: 180, y: 160 })
  const circuit: Circuit = { nodes: [xorGate, andGate], wires: [] }
  const grouped = groupNodes(circuit, { nodeIds: [xorGate.id, andGate.id], label: 'Half Adder' })
  return grouped.ok && grouped.value ? grouped.value : circuit
}

function nextPosition(index: number): Position {
  const offset = 50
  return { x: INITIAL_POSITION.x + index * offset, y: INITIAL_POSITION.y + index * offset }
}
