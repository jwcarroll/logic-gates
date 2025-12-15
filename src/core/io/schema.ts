import type { Circuit, CircuitMetadata, Result, Wire } from '../types'

export type CircuitSchemaVersion = '1.2'
// v1.2 is the first schema version that requires explicit group interfaces + junction nodes.
// Legacy schemas (v1.0/v1.1) are rejected (no migration) per `001-custom-group-ports`.

export interface CircuitImport {
  version: CircuitSchemaVersion
  circuit: Circuit
  metadata?: CircuitMetadata
}

export type CircuitExport = CircuitImport

export function validateCircuitImport(payload: unknown): Result<CircuitImport> {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['Payload must be an object'] }
  }
  const data = payload as Partial<CircuitImport>
  const errors: string[] = []

  if (!data.version) {
    errors.push('Missing version (expected "1.2")')
  } else if (data.version !== '1.2') {
    errors.push(`Unsupported version "${data.version}". This build only supports circuit schema v1.2 (legacy v1.0/v1.1 are rejected).`)
  }
  if (!data.circuit) {
    errors.push('Missing circuit')
  } else {
    errors.push(...validateCircuitShape(data.circuit))
  }

  if (errors.length) {
    return { ok: false, errors }
  }
  return { ok: true, value: data as CircuitImport }
}

function validateCircuitShape(circuit: Circuit): string[] {
  const errors: string[] = []
  if (!Array.isArray(circuit.nodes)) errors.push('Circuit nodes must be an array')
  if (!Array.isArray(circuit.wires)) errors.push('Circuit wires must be an array')
  if (circuit.wires) {
    circuit.wires.forEach((wire: Wire) => {
      if (!wire.source || !wire.target) {
        errors.push('Wire missing endpoints')
      }
    })
  }
  return errors
}
