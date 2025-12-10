import { beforeEach, describe, expect, it } from 'vitest'
import { evaluateChallenge } from '../../core/commands/challengeCommands'
import { getChallengeById } from '../../app/challenges/challengeService'

describe('challenge evaluation', () => {
  beforeEach(() => {
    // fresh copies per test
  })

  it('requires targets to be met before marking success', () => {
    const challenge = getChallengeById('xor-light')
    expect(challenge).toBeDefined()
    if (!challenge) return

    const circuit = challenge.starterCircuit
    const initial = evaluateChallenge(circuit, challenge.target)
    expect(initial.success).toBe(false)

    const switchA = circuit.nodes.find((n) => n.id === 'challenge-switch-a' && n.type === 'switch')
    if (switchA && switchA.type === 'switch') {
      switchA.data.state = true
    }
    const afterToggle = evaluateChallenge(circuit, challenge.target)
    expect(afterToggle.success).toBe(true)
  })

  it('does not mutate the template between loads', () => {
    const first = getChallengeById('xor-light')
    const second = getChallengeById('xor-light')
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    if (!first || !second) return

    first.starterCircuit.nodes.push({
      id: 'extra-light',
      type: 'light',
      position: { x: 0, y: 0 },
      width: 1,
      height: 1,
      data: { state: false, inputPortId: 'extra-port' },
    })

    expect(first.starterCircuit.nodes.length).toBeGreaterThan(second.starterCircuit.nodes.length)
    expect(second.starterCircuit.nodes.length).toBe(4)
  })
})
