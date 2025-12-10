import { describe, expect, it } from 'vitest'
import { buildGateCircuit, getLight, getOutput, setInputs } from './helpers'

describe('NOT gate simulation', () => {
  it('inverts its single input', () => {
    const { circuit, inputs, gateOutputId, lightNodeId } = buildGateCircuit('NOT')

    setInputs(inputs, [false])
    expect(getOutput(circuit, gateOutputId)).toBe(true)
    expect(getLight(circuit, lightNodeId)).toBe(true)

    setInputs(inputs, [true])
    expect(getOutput(circuit, gateOutputId)).toBe(false)
    expect(getLight(circuit, lightNodeId)).toBe(false)
  })
})
