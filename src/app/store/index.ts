import { create } from 'zustand'
import { createGateNode, createLightNode, createSwitchNode } from '../../core/factories'
import { cloneGroup, connect, createGroup, ungroup, updateGroupInterface } from '../../core/commands'
import { makeId } from '../../core/ids'
import { simulate } from '../../core/simulation'
import type { Circuit, CircuitNode, GateType, JunctionNode, Position } from '../../core/types'
import type { Connection, NodeChange } from 'reactflow'
import type { CircuitExport } from '../../core/io/schema'
import { exportCircuit as buildExport, importCircuit as parseImport } from '../../core/io/importExport'
import type { ChallengeTarget } from '../../core/commands/challengeCommands'
import { evaluateChallenge } from '../../core/commands/challengeCommands'
import { getChallengeById } from '../challenges/challengeService'
import { reportGraphErrors, reportImportError } from '../logging/errorReporting'
import { buildDefaultGroupInterfaceDraft } from '../../core/groupInterfaceDraft'
import type { GroupInterface } from '../../core/types'
import { validateGroupInterfaceDraft } from './groupInterfaceDraft'
import { createEmptyHistory, pushHistory, redoHistory, undoHistory } from './history'

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
  selectionUpdatedAt: number
  simulationUpdatedAt: number
  openGroupId: string | null
  notice: { message: string; kind: 'info' | 'warning'; updatedAt: number } | null
  history: ReturnType<typeof createEmptyHistory>
  groupInterfaceDraft: {
    mode: 'create'
    label: string
    nodeIds: string[]
    interfaceDraft: GroupInterface
    available: { inputs: string[]; outputs: string[] }
    errors: string[]
  } | {
    mode: 'edit'
    groupId: string
    interfaceDraft: GroupInterface
    available: { inputs: string[]; outputs: string[] }
    errors: string[]
  } | null
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
  undo: () => boolean
  redo: () => boolean
  groupSelection: (label?: string, nodeIds?: string[]) => { ok: boolean; errors?: string[] }
  editSelectedGroupInterface: () => { ok: boolean; errors?: string[] }
  cancelGroupInterfaceDraft: () => void
  updateGroupInterfaceDraftLabel: (label: string) => void
  addGroupInterfaceDraftPort: (kind: 'input' | 'output') => void
  removeGroupInterfaceDraftPort: (kind: 'input' | 'output', portId: string) => void
  moveGroupInterfaceDraftPort: (kind: 'input' | 'output', portId: string, delta: -1 | 1) => void
  updateGroupInterfaceDraftPortName: (kind: 'input' | 'output', portId: string, name: string) => void
  updateGroupInterfaceDraftPortMapping: (kind: 'input' | 'output', portId: string, mapsToInternalPortId: string) => void
  confirmGroupInterfaceDraft: () => { ok: boolean; errors?: string[] }
  ungroupSelection: () => { ok: boolean; errors?: string[] }
  cloneSelectedGroup: () => { ok: boolean; errors?: string[] }
  addHalfAdderTemplate: () => void
  toggleSwitch: (nodeId: string) => void
  openGroup: (groupId: string) => void
  closeGroup: () => void
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
  selectionUpdatedAt: Date.now(),
  simulationUpdatedAt: Date.now(),
  openGroupId: null,
  notice: null,
  history: createEmptyHistory(),
  groupInterfaceDraft: null,
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
      return { circuit, outputs: sim.outputs, lights: sim.lights, paletteDragging: null, simulationUpdatedAt: Date.now() }
    }),

  addSwitch: () =>
    set((state) => {
      const circuit = {
        ...state.circuit,
        nodes: [...state.circuit.nodes, createSwitchNode(nextPosition(state.circuit.nodes.length))],
      }
      const { outputs, lights } = simulate(circuit)
      return { circuit, outputs, lights, simulationUpdatedAt: Date.now() }
    }),

  addLight: () =>
    set((state) => {
      const circuit = {
        ...state.circuit,
        nodes: [...state.circuit.nodes, createLightNode(nextPosition(state.circuit.nodes.length))],
      }
      const { outputs, lights } = simulate(circuit)
      return { circuit, outputs, lights, simulationUpdatedAt: Date.now() }
    }),

  addGate: (gate) =>
    set((state) => {
      const circuit = {
        ...state.circuit,
        nodes: [...state.circuit.nodes, createGateNode(gate, nextPosition(state.circuit.nodes.length))],
      }
      const { outputs, lights } = simulate(circuit)
      return { circuit, outputs, lights, simulationUpdatedAt: Date.now() }
    }),

  connectWire: (connection) => {
    const state = get()
    const { circuit } = state
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
    set({
      history: pushHistory(state.history, buildHistorySnapshot(state)),
      circuit: result.value,
      outputs,
      lights,
      simulationUpdatedAt: Date.now(),
    })
    return true
  },

  moveNodes: (changes) =>
    set((state) => {
      let updated = state.circuit.nodes
      let selectedIds = state.selectedNodeIds
      let selectionChanged = false
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updated = updated.map((node) => (node.id === change.id ? { ...node, position: change.position! } : node))
        }
        if (change.type === 'select' && typeof change.selected === 'boolean') {
          selectionChanged = true
          selectedIds = change.selected
            ? Array.from(new Set([...selectedIds, change.id]))
            : selectedIds.filter((id) => id !== change.id)
        }
      })
      const circuit: Circuit = { ...state.circuit, nodes: updated }
      return selectionChanged ? { circuit, selectedNodeIds: selectedIds, selectionUpdatedAt: Date.now() } : { circuit, selectedNodeIds: selectedIds }
    }),

  selectNodes: (ids) =>
    set((state) => {
      const next = typeof ids === 'function' ? ids(state.selectedNodeIds) : ids
      const same =
        state.selectedNodeIds.length === next.length &&
        state.selectedNodeIds.every((id) => next.includes(id)) &&
        next.every((id) => state.selectedNodeIds.includes(id))
      if (same) return {}
      return { selectedNodeIds: next, selectionUpdatedAt: Date.now() }
    }),

  undo: () => {
    const state = get()
    const current = buildHistorySnapshot(state)
    const result = undoHistory(state.history, current)
    if (!result) return false
    const sim = simulate(result.snapshot.circuit)
    set({
      history: result.history,
      circuit: result.snapshot.circuit,
      outputs: sim.outputs,
      lights: sim.lights,
      selectedNodeIds: result.snapshot.selectedNodeIds,
      openGroupId: result.snapshot.openGroupId,
      selectionUpdatedAt: Date.now(),
      simulationUpdatedAt: Date.now(),
    })
    return true
  },

  redo: () => {
    const state = get()
    const current = buildHistorySnapshot(state)
    const result = redoHistory(state.history, current)
    if (!result) return false
    const sim = simulate(result.snapshot.circuit)
    set({
      history: result.history,
      circuit: result.snapshot.circuit,
      outputs: sim.outputs,
      lights: sim.lights,
      selectedNodeIds: result.snapshot.selectedNodeIds,
      openGroupId: result.snapshot.openGroupId,
      selectionUpdatedAt: Date.now(),
      simulationUpdatedAt: Date.now(),
    })
    return true
  },

  groupSelection: (label = 'Group', nodeIds?: string[]) => {
    const state = get()
    const targets = nodeIds ?? state.selectedNodeIds
    const existingTargets = targets.filter((id) => state.circuit.nodes.some((n) => n.id === id))
    if (!existingTargets.length) return { ok: false, errors: ['No nodes selected to group'] }
    const draft = buildDefaultGroupInterfaceDraft(state.circuit, existingTargets)
    if (!draft.ok || !draft.value) return { ok: false, errors: draft.errors }

    const available = collectAvailableInternalPorts(state.circuit, existingTargets)
    const errors = validateGroupInterfaceDraft(draft.value)

    set({
      groupInterfaceDraft: {
        mode: 'create',
        label,
        nodeIds: existingTargets,
        interfaceDraft: draft.value,
        available,
        errors,
      },
    })

    return { ok: true }
  },

  editSelectedGroupInterface: () => {
    const state = get()
    const groupId = state.selectedNodeIds.find((id) => state.circuit.nodes.find((n) => n.id === id && n.type === 'group') !== undefined)
    if (!groupId) return { ok: false, errors: ['No group selected'] }
    const group = state.circuit.nodes.find((n) => n.type === 'group' && n.id === groupId)
    if (!group || group.type !== 'group') return { ok: false, errors: ['Group not found'] }

    const junctions = state.circuit.nodes.filter((n): n is JunctionNode => n.type === 'junction' && n.groupId === groupId)
    const available = {
      inputs: junctions.map((j) => j.data.outputPortId),
      outputs: junctions.map((j) => j.data.inputPortId),
    }
    const errors = validateGroupInterfaceDraft(group.data.interface)
    set({
      groupInterfaceDraft: {
        mode: 'edit',
        groupId,
        interfaceDraft: group.data.interface,
        available,
        errors,
      },
    })
    return { ok: true }
  },

  cancelGroupInterfaceDraft: () => set({ groupInterfaceDraft: null }),
  updateGroupInterfaceDraftLabel: (label) =>
    set((state) => {
      const draft = state.groupInterfaceDraft
      if (!draft || draft.mode !== 'create') return {}
      return { groupInterfaceDraft: { ...draft, label } }
    }),
  addGroupInterfaceDraftPort: (kind) =>
    set((state) => {
      if (!state.groupInterfaceDraft) return {}
      const nextId = kind === 'input' ? makeId('group-in') : makeId('group-out')
      const nextPort = { id: nextId, kind, name: '', mapsToInternalPortId: '' }
      const interfaceDraft =
        kind === 'input'
          ? { ...state.groupInterfaceDraft.interfaceDraft, inputs: [...state.groupInterfaceDraft.interfaceDraft.inputs, nextPort] }
          : { ...state.groupInterfaceDraft.interfaceDraft, outputs: [...state.groupInterfaceDraft.interfaceDraft.outputs, nextPort] }
      const errors = validateGroupInterfaceDraft(interfaceDraft)
      return { groupInterfaceDraft: { ...state.groupInterfaceDraft, interfaceDraft, errors } }
    }),
  removeGroupInterfaceDraftPort: (kind, portId) =>
    set((state) => {
      if (!state.groupInterfaceDraft) return {}
      const interfaceDraft =
        kind === 'input'
          ? { ...state.groupInterfaceDraft.interfaceDraft, inputs: state.groupInterfaceDraft.interfaceDraft.inputs.filter((p) => p.id !== portId) }
          : { ...state.groupInterfaceDraft.interfaceDraft, outputs: state.groupInterfaceDraft.interfaceDraft.outputs.filter((p) => p.id !== portId) }
      const errors = validateGroupInterfaceDraft(interfaceDraft)
      return { groupInterfaceDraft: { ...state.groupInterfaceDraft, interfaceDraft, errors } }
    }),
  moveGroupInterfaceDraftPort: (kind, portId, delta) =>
    set((state) => {
      if (!state.groupInterfaceDraft) return {}
      const list = kind === 'input' ? [...state.groupInterfaceDraft.interfaceDraft.inputs] : [...state.groupInterfaceDraft.interfaceDraft.outputs]
      const idx = list.findIndex((p) => p.id === portId)
      const nextIdx = idx + delta
      if (idx < 0 || nextIdx < 0 || nextIdx >= list.length) return {}
      const [moved] = list.splice(idx, 1)
      list.splice(nextIdx, 0, moved)
      const interfaceDraft = kind === 'input' ? { ...state.groupInterfaceDraft.interfaceDraft, inputs: list } : { ...state.groupInterfaceDraft.interfaceDraft, outputs: list }
      const errors = validateGroupInterfaceDraft(interfaceDraft)
      return { groupInterfaceDraft: { ...state.groupInterfaceDraft, interfaceDraft, errors } }
    }),
  updateGroupInterfaceDraftPortName: (kind, portId, name) =>
    set((state) => {
      if (!state.groupInterfaceDraft) return {}
      const interfaceDraft =
        kind === 'input'
          ? {
              ...state.groupInterfaceDraft.interfaceDraft,
              inputs: state.groupInterfaceDraft.interfaceDraft.inputs.map((p) => (p.id === portId ? { ...p, name } : p)),
            }
          : {
              ...state.groupInterfaceDraft.interfaceDraft,
              outputs: state.groupInterfaceDraft.interfaceDraft.outputs.map((p) => (p.id === portId ? { ...p, name } : p)),
            }
      const errors = validateGroupInterfaceDraft(interfaceDraft)
      return { groupInterfaceDraft: { ...state.groupInterfaceDraft, interfaceDraft, errors } }
    }),
  updateGroupInterfaceDraftPortMapping: (kind, portId, mapsToInternalPortId) =>
    set((state) => {
      if (!state.groupInterfaceDraft) return {}
      const interfaceDraft =
        kind === 'input'
          ? {
              ...state.groupInterfaceDraft.interfaceDraft,
              inputs: state.groupInterfaceDraft.interfaceDraft.inputs.map((p) => (p.id === portId ? { ...p, mapsToInternalPortId } : p)),
            }
          : {
              ...state.groupInterfaceDraft.interfaceDraft,
              outputs: state.groupInterfaceDraft.interfaceDraft.outputs.map((p) => (p.id === portId ? { ...p, mapsToInternalPortId } : p)),
            }
      const errors = validateGroupInterfaceDraft(interfaceDraft)
      return { groupInterfaceDraft: { ...state.groupInterfaceDraft, interfaceDraft, errors } }
    }),
  confirmGroupInterfaceDraft: () => {
    const state = get()
    const draft = state.groupInterfaceDraft
    if (!draft) return { ok: false, errors: ['No active group interface draft'] }
    const errors = validateGroupInterfaceDraft(draft.interfaceDraft)
    if (errors.length) {
      set({ groupInterfaceDraft: { ...draft, errors } as AppState['groupInterfaceDraft'] })
      return { ok: false, errors }
    }

    if (draft.mode === 'create') {
      const result = createGroup(state.circuit, {
        nodeIds: draft.nodeIds,
        label: draft.label,
        collapsed: true,
        interfaceDraft: draft.interfaceDraft,
      })
      if (!result.ok || !result.value) return { ok: false, errors: result.errors }
      const sim = simulate(result.value)
      const groupId = findLatestGroupId(result.value)
      set({
        history: pushHistory(state.history, buildHistorySnapshot(state)),
        circuit: result.value,
        outputs: sim.outputs,
        lights: sim.lights,
        selectedNodeIds: groupId ? [groupId] : [],
        selectionUpdatedAt: Date.now(),
        simulationUpdatedAt: Date.now(),
        openGroupId: null,
        groupInterfaceDraft: null,
      })
      return { ok: true }
    }

    const update = updateGroupInterface(state.circuit, draft.groupId, draft.interfaceDraft)
    if (!update.ok || !update.value) {
      set({ groupInterfaceDraft: { ...draft, errors: update.errors ?? ['Interface update failed'] } })
      return { ok: false, errors: update.errors }
    }
    const sim = simulate(update.value.circuit)
    set({
      history: pushHistory(state.history, buildHistorySnapshot(state)),
      circuit: update.value.circuit,
      outputs: sim.outputs,
      lights: sim.lights,
      selectedNodeIds: [draft.groupId],
      selectionUpdatedAt: Date.now(),
      simulationUpdatedAt: Date.now(),
      notice: { message: 'Interface updated. Rewiring required.', kind: 'warning', updatedAt: Date.now() },
      groupInterfaceDraft: null,
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
    set({
      circuit: result.value,
      outputs: sim.outputs,
      lights: sim.lights,
      selectedNodeIds: [],
      selectionUpdatedAt: Date.now(),
      simulationUpdatedAt: Date.now(),
    })
    return { ok: true }
  },

  cloneSelectedGroup: () => {
    const state = get()
    const groupId = state.selectedNodeIds.find((id) => state.circuit.nodes.find((n) => n.id === id && n.type === 'group') !== undefined)
    if (!groupId) return { ok: false, errors: ['No group selected'] }
    const result = cloneGroup(state.circuit, groupId, { x: 60, y: 40 })
    if (!result.ok || !result.value) return { ok: false, errors: result.errors }
    const sim = simulate(result.value)
    set({ circuit: result.value, outputs: sim.outputs, lights: sim.lights, simulationUpdatedAt: Date.now() })
    return { ok: true }
  },

  addHalfAdderTemplate: () =>
    set((state) => {
      const template = buildHalfAdderTemplate()
      const mergedNodes = [...state.circuit.nodes, ...template.nodes]
      const mergedWires = [...state.circuit.wires, ...template.wires]
      const circuit = { ...state.circuit, nodes: mergedNodes, wires: mergedWires }
      const sim = simulate(circuit)
      return { circuit, outputs: sim.outputs, lights: sim.lights, simulationUpdatedAt: Date.now() }
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
      return { circuit, outputs, lights, simulationUpdatedAt: Date.now() }
    }),

  openGroup: (groupId) =>
    set((state) => {
      const group = state.circuit.nodes.find((n) => n.type === 'group' && n.id === groupId)
      if (!group) return {}
      return { openGroupId: groupId, selectedNodeIds: [], selectionUpdatedAt: Date.now() }
    }),

  closeGroup: () =>
    set((state) => {
      if (!state.openGroupId) return {}
      const groupId = state.openGroupId
      return { openGroupId: null, selectedNodeIds: [groupId], selectionUpdatedAt: Date.now() }
    }),

  exportCircuit: () => {
    const result = buildExport(get().circuit)
    if (!result.ok || !result.value) {
      return { version: '1.2' as const, circuit: emptyCircuit }
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
    set({
      circuit,
      outputs,
      lights,
      challengeStatus: { state: 'idle' },
      currentChallengeTarget: undefined,
      selectedNodeIds: [],
      selectionUpdatedAt: Date.now(),
      simulationUpdatedAt: Date.now(),
      openGroupId: null,
    })
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
      selectionUpdatedAt: Date.now(),
      simulationUpdatedAt: Date.now(),
      openGroupId: null,
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
      selectionUpdatedAt: Date.now(),
      simulationUpdatedAt: Date.now(),
      openGroupId: null,
      paletteDragging: null,
      notice: null,
      history: createEmptyHistory(),
      challengeStatus: { state: 'idle' },
      currentChallengeTarget: undefined,
    }),
}))

if (typeof window !== 'undefined') {
  // Expose store for Playwright/browser E2E hooks
  ;(window as Window & { __APP_STORE__?: typeof useAppStore }).__APP_STORE__ = useAppStore
}

function buildHistorySnapshot(state: { circuit: Circuit; selectedNodeIds: string[]; openGroupId: string | null }) {
  return {
    circuit: state.circuit,
    selectedNodeIds: state.selectedNodeIds,
    openGroupId: state.openGroupId,
  }
}

function findLatestGroupId(circuit: Circuit): string {
  const groups = circuit.nodes.filter((n) => n.type === 'group')
  return groups.length ? groups[groups.length - 1].id : ''
}

function collectAvailableInternalPorts(circuit: Circuit, nodeIds: string[]) {
  const selected = new Set(nodeIds)
  const inputs: string[] = []
  const outputs: string[] = []
  circuit.nodes.forEach((node) => {
    if (!selected.has(node.id)) return
    switch (node.type) {
      case 'light':
        inputs.push(node.data.inputPortId)
        break
      case 'gate':
        inputs.push(...node.data.inputPortIds)
        outputs.push(node.data.outputPortId)
        break
      case 'switch':
        outputs.push(node.data.outputPortId)
        break
      case 'junction':
        inputs.push(node.data.inputPortId)
        outputs.push(node.data.outputPortId)
        break
      case 'group':
        inputs.push(...node.data.interface.inputs.map((p) => p.id))
        outputs.push(...node.data.interface.outputs.map((p) => p.id))
        break
    }
  })
  return { inputs, outputs }
}

function buildHalfAdderTemplate(): Circuit {
  const swA = createSwitchNode({ x: 40, y: 120 })
  const swB = createSwitchNode({ x: 40, y: 220 })
  swA.data.label = 'A'
  swB.data.label = 'B'

  const xorGate = createGateNode('XOR', { x: 200, y: 140 })
  const andGate = createGateNode('AND', { x: 220, y: 240 })

  const circuit: Circuit = {
    nodes: [swA, swB, xorGate, andGate],
    wires: [
      // A feeds XOR.in0 + AND.in0
      { id: makeId('wire'), source: swA.data.outputPortId, sourceNode: swA.id, target: xorGate.data.inputPortIds[0], targetNode: xorGate.id },
      { id: makeId('wire'), source: swA.data.outputPortId, sourceNode: swA.id, target: andGate.data.inputPortIds[0], targetNode: andGate.id },
      // B feeds XOR.in1 + AND.in1
      { id: makeId('wire'), source: swB.data.outputPortId, sourceNode: swB.id, target: xorGate.data.inputPortIds[1], targetNode: xorGate.id },
      { id: makeId('wire'), source: swB.data.outputPortId, sourceNode: swB.id, target: andGate.data.inputPortIds[1], targetNode: andGate.id },
    ],
  }

  const grouped = createGroup(circuit, {
    nodeIds: [xorGate.id, andGate.id],
    label: 'Half Adder',
    collapsed: true,
    interfaceDraft: {
      inputs: [
        { id: makeId('group-in'), kind: 'input', name: 'A', mapsToInternalPortId: xorGate.data.inputPortIds[0] },
        { id: makeId('group-in'), kind: 'input', name: 'B', mapsToInternalPortId: xorGate.data.inputPortIds[1] },
      ],
      outputs: [
        { id: makeId('group-out'), kind: 'output', name: 'SUM', mapsToInternalPortId: xorGate.data.outputPortId },
        { id: makeId('group-out'), kind: 'output', name: 'CARRY', mapsToInternalPortId: andGate.data.outputPortId },
      ],
    },
  })

  if (!grouped.ok || !grouped.value) return circuit

  // Remove the temporary switches and their external wires; keep the grouped half-adder as a reusable subcircuit template.
  const cleanedNodes = grouped.value.nodes.filter((n) => n.id !== swA.id && n.id !== swB.id)
  const cleanedWires = grouped.value.wires.filter((w) => w.sourceNode !== swA.id && w.sourceNode !== swB.id && w.targetNode !== swA.id && w.targetNode !== swB.id)
  return { ...grouped.value, nodes: cleanedNodes, wires: cleanedWires }
}

function nextPosition(index: number): Position {
  const offset = 50
  return { x: INITIAL_POSITION.x + index * offset, y: INITIAL_POSITION.y + index * offset }
}
