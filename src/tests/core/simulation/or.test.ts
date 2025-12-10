import { describe, expect, it } from 'vitest'
import { buildGateCircuit, getLight, getOutput, setInputs } from './helpers'

describe('OR gate simulation', () => {
  it('outputs true when any input is true', () => {
    const { circuit, inputs, gateOutputId, lightNodeId } = buildGateCircuit('OR')

    setInputs(inputs, [false, false])
    expect(getOutput(circuit, gateOutputId)).toBe(false)

    setInputs(inputs, [true, false])
    expect(getOutput(circuit, gateOutputId)).toBe(true)

    setInputs(inputs, [false, true])
    expect(getOutput(circuit, gateOutputId)).toBe(true)

    setInputs(inputs, [true, true])
    expect(getOutput(circuit, gateOutputId)).toBe(true)
    expect(getLight(circuit, lightNodeId)).toBe(true)
  })
})
