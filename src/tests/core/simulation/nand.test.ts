import { describe, expect, it } from 'vitest'
import { buildGateCircuit, getOutput, setInputs } from './helpers'

describe('NAND gate simulation', () => {
  it('outputs false only when all inputs are true', () => {
    const { circuit, inputs, gateOutputId } = buildGateCircuit('NAND')

    setInputs(inputs, [false, false])
    expect(getOutput(circuit, gateOutputId)).toBe(true)

    setInputs(inputs, [true, false])
    expect(getOutput(circuit, gateOutputId)).toBe(true)

    setInputs(inputs, [false, true])
    expect(getOutput(circuit, gateOutputId)).toBe(true)

    setInputs(inputs, [true, true])
    expect(getOutput(circuit, gateOutputId)).toBe(false)
  })
})
