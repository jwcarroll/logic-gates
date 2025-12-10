import { describe, expect, it } from 'vitest'
import { buildGateCircuit, getOutput, setInputs } from './helpers'

describe('XOR gate simulation', () => {
  it('outputs true when exactly one input is true', () => {
    const { circuit, inputs, gateOutputId } = buildGateCircuit('XOR')

    setInputs(inputs, [false, false])
    expect(getOutput(circuit, gateOutputId)).toBe(false)

    setInputs(inputs, [true, false])
    expect(getOutput(circuit, gateOutputId)).toBe(true)

    setInputs(inputs, [false, true])
    expect(getOutput(circuit, gateOutputId)).toBe(true)

    setInputs(inputs, [true, true])
    expect(getOutput(circuit, gateOutputId)).toBe(false)
  })
})
