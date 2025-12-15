import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { exportCircuit, importCircuit } from '../../core/io/importExport'
import type { CircuitExport } from '../../core/io/schema'

const fixtureDir = join(__dirname, '..', 'fixtures', 'custom-group-ports')

describe('import/export v1.2', () => {
  it('imports a v1.2 payload successfully', () => {
    const payload = JSON.parse(readFileSync(join(fixtureDir, 'sample-v1.2-group.json'), 'utf-8')) as unknown
    const result = importCircuit(payload)
    expect(result.ok).toBe(true)
    expect(result.value?.nodes.length).toBeGreaterThan(0)
  })

  it('rejects legacy versions without migration', () => {
    const payload = JSON.parse(readFileSync(join(fixtureDir, 'legacy-v1.1-group.json'), 'utf-8')) as unknown
    const result = importCircuit(payload)
    expect(result.ok).toBe(false)
    expect(result.errors?.join(' ')).toMatch(/unsupported|version/i)
  })

  it('exports with version 1.2 by default', () => {
    const payload = JSON.parse(readFileSync(join(fixtureDir, 'sample-v1.2-group.json'), 'utf-8')) as CircuitExport
    const result = exportCircuit(payload.circuit)
    expect(result.ok).toBe(true)
    expect(result.value?.version).toBe('1.2')
  })
})

