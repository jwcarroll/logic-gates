import { makeId } from './ids'
import type { Circuit, CircuitNode, ExposedPort, GroupInterface, PortKind, Result, Wire } from './types'

/**
 * Draft interface used during group creation.
 *
 * Note: In a draft, `mapsToInternalPortId` refers to an existing port on a selected node.
 * The finalized group interface stored on the created group node will map to junction ports instead.
 */
export type GroupInterfaceDraft = GroupInterface

export function buildDefaultGroupInterfaceDraft(circuit: Circuit, nodeIds: string[]): Result<GroupInterfaceDraft> {
  if (!nodeIds.length) return { ok: false, errors: ['No nodes selected to group'] }

  const selectedIds = new Set(nodeIds)
  const selectedNodes = circuit.nodes.filter((n) => selectedIds.has(n.id))
  if (selectedNodes.length !== nodeIds.length) return { ok: false, errors: ['One or more selected nodes are missing'] }

  const inputs: ExposedPort[] = []
  const outputs: ExposedPort[] = []

  const exposedInputs = new Set<string>() // internal input port ids already added
  const exposedOutputs = new Set<string>() // internal output port ids already added
  const exposedInputSources = new Set<string>() // outside source port ids already added (fanout collapses to one exposed input)

  // Prefer boundary ports first (preserves existing wiring by default).
  circuit.wires.forEach((wire) => {
    const sourceInside = selectedIds.has(wire.sourceNode)
    const targetInside = selectedIds.has(wire.targetNode)
    if (!sourceInside && targetInside) {
      if (exposedInputSources.has(wire.source)) return
      exposedInputSources.add(wire.source)
      exposedInputs.add(wire.target)
      inputs.push(makeDraftPort('input', inputs.length, wire.target))
    }
    if (sourceInside && !targetInside) {
      if (exposedOutputs.has(wire.source)) return
      exposedOutputs.add(wire.source)
      outputs.push(makeDraftPort('output', outputs.length, wire.source))
    }
  })

  // Then expose any unconnected internal ports as "template" ports (legacy behavior).
  selectedNodes.forEach((node) => {
    getInputPorts(node).forEach((portId) => {
      if (exposedInputs.has(portId)) return
      if (!hasInbound(circuit.wires, portId)) {
        exposedInputs.add(portId)
        inputs.push(makeDraftPort('input', inputs.length, portId))
      }
    })
    getOutputPorts(node).forEach((portId) => {
      if (exposedOutputs.has(portId)) return
      const outbound = circuit.wires.filter((w) => w.source === portId)
      const hasOutsideTarget = outbound.some((w) => !selectedIds.has(w.targetNode))
      if (!outbound.length || hasOutsideTarget) {
        exposedOutputs.add(portId)
        outputs.push(makeDraftPort('output', outputs.length, portId))
      }
    })
  })

  return { ok: true, value: { inputs, outputs } }
}

function makeDraftPort(kind: PortKind, index: number, mapsToInternalPortId: string): ExposedPort {
  const id = kind === 'input' ? makeId('group-in') : makeId('group-out')
  const name = kind === 'input' ? `In ${index + 1}` : `Out ${index + 1}`
  return { id, kind, name, mapsToInternalPortId }
}

function hasInbound(wires: Wire[], portId: string) {
  return wires.some((w) => w.target === portId)
}

function getInputPorts(node: CircuitNode): string[] {
  switch (node.type) {
    case 'light':
      return [node.data.inputPortId]
    case 'gate':
      return [...node.data.inputPortIds]
    case 'group':
      return node.data.interface.inputs.map((p) => p.id)
    case 'junction':
      return [node.data.inputPortId]
    default:
      return []
  }
}

function getOutputPorts(node: CircuitNode): string[] {
  switch (node.type) {
    case 'switch':
      return [node.data.outputPortId]
    case 'gate':
      return [node.data.outputPortId]
    case 'group':
      return node.data.interface.outputs.map((p) => p.id)
    case 'junction':
      return [node.data.outputPortId]
    default:
      return []
  }
}
