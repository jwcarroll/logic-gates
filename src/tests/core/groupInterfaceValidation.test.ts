import { describe, expect, it } from 'vitest'
import { validateGroupInterface } from '../../core/groupInterfaceValidation'
import type { Circuit, GroupInterface, JunctionNode } from '../../core/types'

function buildCircuitWithJunctions(groupId: string): { circuit: Circuit; inJunction: JunctionNode; outJunction: JunctionNode } {
  const inJunction: JunctionNode = {
    id: 'j-in',
    type: 'junction',
    position: { x: 0, y: 0 },
    width: 60,
    height: 40,
    groupId,
    data: { inputPortId: 'j-in-in', outputPortId: 'j-in-out' },
  }
  const outJunction: JunctionNode = {
    id: 'j-out',
    type: 'junction',
    position: { x: 0, y: 0 },
    width: 60,
    height: 40,
    groupId,
    data: { inputPortId: 'j-out-in', outputPortId: 'j-out-out' },
  }
  return { circuit: { nodes: [inJunction, outJunction], wires: [] }, inJunction, outJunction }
}

describe('validateGroupInterface', () => {
  it('accepts a valid interface with Option A mapping convention', () => {
    const groupId = 'g1'
    const { circuit, inJunction, outJunction } = buildCircuitWithJunctions(groupId)
    const gi: GroupInterface = {
      inputs: [{ id: 'in-a', kind: 'input', name: 'A', mapsToInternalPortId: inJunction.data.outputPortId }],
      outputs: [{ id: 'out-y', kind: 'output', name: 'Y', mapsToInternalPortId: outJunction.data.inputPortId }],
    }

    const result = validateGroupInterface(gi, { circuit, groupId, requireAtLeastOnePort: true })
    expect(result.ok).toBe(true)
  })

  it('rejects empty interfaces when requireAtLeastOnePort is enabled (FR-001a)', () => {
    const gi: GroupInterface = { inputs: [], outputs: [] }
    const result = validateGroupInterface(gi, { requireAtLeastOnePort: true })
    expect(result.ok).toBe(false)
    expect(result.errors?.join(' ')).toMatch(/at least one/i)
  })

  it('rejects duplicate exposed port ids (FR-007)', () => {
    const gi: GroupInterface = {
      inputs: [
        { id: 'p1', kind: 'input', name: 'A', mapsToInternalPortId: 'x' },
        { id: 'p1', kind: 'input', name: 'B', mapsToInternalPortId: 'y' },
      ],
      outputs: [],
    }
    const result = validateGroupInterface(gi)
    expect(result.ok).toBe(false)
    expect(result.errors?.join(' ')).toMatch(/duplicate exposed port id/i)
  })

  it('rejects missing mappings (FR-002/FR-007)', () => {
    const gi: GroupInterface = {
      inputs: [{ id: 'p1', kind: 'input', name: 'A', mapsToInternalPortId: '' }],
      outputs: [],
    }
    const result = validateGroupInterface(gi)
    expect(result.ok).toBe(false)
    expect(result.errors?.join(' ')).toMatch(/map to an internal port/i)
  })

  it('rejects duplicate mappings to the same internal port (FR-007)', () => {
    const gi: GroupInterface = {
      inputs: [{ id: 'p1', kind: 'input', name: 'A', mapsToInternalPortId: 'j1' }],
      outputs: [{ id: 'p2', kind: 'output', name: 'Y', mapsToInternalPortId: 'j1' }],
    }
    const result = validateGroupInterface(gi)
    expect(result.ok).toBe(false)
    expect(result.errors?.join(' ')).toMatch(/duplicate mapping/i)
  })

  it('enforces Option A direction rules and rejects non-junction ports (FR-006/FR-006a)', () => {
    const groupId = 'g1'
    const { circuit, inJunction } = buildCircuitWithJunctions(groupId)

    const wrongInputMapsToJunctionInput: GroupInterface = {
      inputs: [{ id: 'in-a', kind: 'input', name: 'A', mapsToInternalPortId: inJunction.data.inputPortId }],
      outputs: [],
    }
    const res1 = validateGroupInterface(wrongInputMapsToJunctionInput, { circuit, groupId })
    expect(res1.ok).toBe(false)

    const mapsToNonJunction: GroupInterface = {
      inputs: [{ id: 'in-a', kind: 'input', name: 'A', mapsToInternalPortId: 'not-a-junction-port' }],
      outputs: [],
    }
    const res2 = validateGroupInterface(mapsToNonJunction, { circuit, groupId })
    expect(res2.ok).toBe(false)
  })
})

