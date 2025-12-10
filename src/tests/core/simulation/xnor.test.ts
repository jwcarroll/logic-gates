import { describe, expect, it } from 'vitest'
import { buildGateCircuit, getOutput, setInputs } from './helpers'

describe('XNOR gate simulation', () => {
  it('outputs true when inputs are equal', () => {
    const { circuit, inputs, gateOutputId } = buildGateCircuit('XNOR')

    setInputs(inputs, [false, false])
    expect(getOutput(circuit, gateOutputId)).toBe(true)

    setInputs(inputs, [true, false])
    expect(getOutput(circuit, gateOutputId)).toBe(false)

    setInputs(inputs, [false, true])
    expect(getOutput(circuit, gateOutputId)).toBe(false)

    setInputs(inputs, [true, true])
    expect(getOutput(circuit, gateOutputId)).toBe(true)
  })
})
