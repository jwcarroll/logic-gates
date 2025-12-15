import type { GroupInterface } from '../../core/types'

export function validateGroupInterfaceDraft(draft: GroupInterface): string[] {
  const errors: string[] = []
  const ports = [...draft.inputs, ...draft.outputs]
  if (ports.length === 0) errors.push('Expose at least one port')

  const seenIds = new Set<string>()
  const seenInternal = new Set<string>()

  ports.forEach((p) => {
    if (!p.id) errors.push('Port id is required')
    if (p.id && seenIds.has(p.id)) errors.push(`Duplicate port id: ${p.id}`)
    if (p.id) seenIds.add(p.id)

    if (!p.name?.trim()) errors.push(`Port ${p.id || '<unknown>'} name is required`)
    if (!p.mapsToInternalPortId) errors.push(`Port ${p.id || '<unknown>'} must be mapped to an internal port`)

    if (p.mapsToInternalPortId && seenInternal.has(p.mapsToInternalPortId)) {
      errors.push(`Internal port is mapped more than once: ${p.mapsToInternalPortId}`)
    }
    if (p.mapsToInternalPortId) seenInternal.add(p.mapsToInternalPortId)
  })

  return errors
}

