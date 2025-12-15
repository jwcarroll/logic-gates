import type { Circuit, Result } from '../types'
import type { CircuitExport, CircuitSchemaVersion } from './schema'
import { validateCircuitImport } from './schema'

const DEFAULT_VERSION: CircuitSchemaVersion = '1.2'

/**
 * Prepare a circuit export payload with schema version metadata.
 */
export function exportCircuit(circuit: Circuit, version: CircuitSchemaVersion = DEFAULT_VERSION): Result<CircuitExport> {
  if (!circuit) {
    return { ok: false, errors: ['Missing circuit to export'] }
  }
  return { ok: true, value: { version, circuit } }
}

/**
 * Validate and parse an import payload into a circuit.
 */
export function importCircuit(payload: unknown): Result<Circuit> {
  const validation = validateCircuitImport(payload)
  if (!validation.ok || !validation.value) {
    return { ok: false, errors: validation.errors }
  }
  return { ok: true, value: validation.value.circuit }
}
