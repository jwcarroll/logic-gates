import { describe, expect, it } from 'vitest'
import { buildGateCircuit, getLight, getOutput, setInputs } from './helpers'

describe('AND gate simulation', () => {
  it('outputs true only when all inputs true', () => {
    const { circuit, inputs, gateOutputId, lightNodeId } = buildGateCircuit('AND')

    setInputs(inputs, [false, false])
    expect(getOutput(circuit, gateOutputId)).toBe(false)
    expect(getLight(circuit, lightNodeId)).toBe(false)

    setInputs(inputs, [true, false])
    expect(getOutput(circuit, gateOutputId)).toBe(false)

    setInputs(inputs, [false, true])
    expect(getOutput(circuit, gateOutputId)).toBe(false)

    setInputs(inputs, [true, true])
    expect(getOutput(circuit, gateOutputId)).toBe(true)
    expect(getLight(circuit, lightNodeId)).toBe(true)
  })
})
