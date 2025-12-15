import type { Circuit, ExposedPort, GroupInterface, JunctionNode, PortKind, Result } from './types'

type PortKindLookup = Record<string, PortKind | undefined>

function buildJunctionPortKindLookup(circuit: Circuit, groupId: string): PortKindLookup {
  const lookup: PortKindLookup = {}
  circuit.nodes.forEach((node) => {
    if (node.type !== 'junction') return
    if (node.groupId !== groupId) return
    lookup[node.data.inputPortId] = 'input'
    lookup[node.data.outputPortId] = 'output'
  })
  return lookup
}

function validatePortIdsUnique(ports: ExposedPort[], errors: string[]) {
  const seen = new Set<string>()
  ports.forEach((p) => {
    if (seen.has(p.id)) errors.push(`Duplicate exposed port id: ${p.id}`)
    seen.add(p.id)
  })
}

function validateMappingsUnique(ports: ExposedPort[], errors: string[]) {
  const seen = new Set<string>()
  ports.forEach((p) => {
    if (seen.has(p.mapsToInternalPortId)) errors.push(`Duplicate mapping to internal port: ${p.mapsToInternalPortId}`)
    seen.add(p.mapsToInternalPortId)
  })
}

/**
 * Validate a proposed `GroupInterface` against basic invariants and (optionally) a concrete circuit/group.
 *
 * Option A mapping convention:
 * - Exposed inputs MUST map to a junction `outputPortId` inside the group
 * - Exposed outputs MUST map to a junction `inputPortId` inside the group
 */
export function validateGroupInterface(
  groupInterface: GroupInterface,
  opts?: { circuit?: Circuit; groupId?: string; requireAtLeastOnePort?: boolean },
): Result<GroupInterface> {
  const errors: string[] = []
  const allPorts = [...groupInterface.inputs, ...groupInterface.outputs]

  if (opts?.requireAtLeastOnePort && allPorts.length === 0) {
    errors.push('Group interface must expose at least one port')
  }

  allPorts.forEach((p) => {
    if (!p.id) errors.push('Exposed port id is required')
    if (!p.name) errors.push('Exposed port name is required')
    if (!p.mapsToInternalPortId) errors.push(`Exposed port ${p.id || '<unknown>'} must map to an internal port`)
    if (p.kind !== 'input' && p.kind !== 'output') errors.push(`Exposed port ${p.id || '<unknown>'} has invalid kind`)
  })

  validatePortIdsUnique(allPorts, errors)
  validateMappingsUnique(allPorts, errors)

  if (opts?.circuit && opts.groupId) {
    const portKinds = buildJunctionPortKindLookup(opts.circuit, opts.groupId)
    groupInterface.inputs.forEach((p) => {
      const internalKind = portKinds[p.mapsToInternalPortId]
      if (internalKind !== 'output') {
        errors.push(`Input port ${p.id} must map to a junction output port inside the group`)
      }
    })
    groupInterface.outputs.forEach((p) => {
      const internalKind = portKinds[p.mapsToInternalPortId]
      if (internalKind !== 'input') {
        errors.push(`Output port ${p.id} must map to a junction input port inside the group`)
      }
    })
  }

  if (errors.length) return { ok: false, errors }
  return { ok: true, value: groupInterface }
}

export function buildGroupPortMap(groupInterface: GroupInterface) {
  return {
    inputs: Object.fromEntries(groupInterface.inputs.map((p) => [p.id, p.mapsToInternalPortId])),
    outputs: Object.fromEntries(groupInterface.outputs.map((p) => [p.id, p.mapsToInternalPortId])),
  }
}

export function findJunctionNodes(circuit: Circuit, groupId: string): JunctionNode[] {
  return circuit.nodes.filter((n): n is JunctionNode => n.type === 'junction' && n.groupId === groupId)
}

