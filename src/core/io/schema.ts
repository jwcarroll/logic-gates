import type { Circuit, CircuitMetadata, Result, Wire } from '../types'

export type CircuitSchemaVersion = '1.0' | '1.1'

export interface CircuitImport {
  version: CircuitSchemaVersion
  circuit: Circuit
  metadata?: CircuitMetadata
}

export interface CircuitExport extends CircuitImport {}

export function validateCircuitImport(payload: unknown): Result<CircuitImport> {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['Payload must be an object'] }
  }
  const data = payload as Partial<CircuitImport>
  const errors: string[] = []

  if (!data.version || (data.version !== '1.0' && data.version !== '1.1')) {
    errors.push('Unsupported or missing version')
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
