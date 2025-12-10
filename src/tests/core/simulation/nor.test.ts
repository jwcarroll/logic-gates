import { describe, expect, it } from 'vitest'
import { buildGateCircuit, getOutput, setInputs } from './helpers'

describe('NOR gate simulation', () => {
  it('outputs true only when all inputs are false', () => {
    const { circuit, inputs, gateOutputId } = buildGateCircuit('NOR')

    setInputs(inputs, [false, false])
    expect(getOutput(circuit, gateOutputId)).toBe(true)

    setInputs(inputs, [true, false])
    expect(getOutput(circuit, gateOutputId)).toBe(false)

    setInputs(inputs, [false, true])
    expect(getOutput(circuit, gateOutputId)).toBe(false)

    setInputs(inputs, [true, true])
    expect(getOutput(circuit, gateOutputId)).toBe(false)
  })
})
