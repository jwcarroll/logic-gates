import { simulate } from '../simulation'
import type { Circuit } from '../types'

export interface ChallengeTarget {
  lights?: Record<string, boolean>
  outputs?: Record<string, boolean>
}

export interface ChallengeEvaluation {
  success: boolean
  details: string[]
}

export function evaluateChallenge(circuit: Circuit, target: ChallengeTarget): ChallengeEvaluation {
  const sim = simulate(circuit)
  const details: string[] = []
  let success = sim.converged

  if (!sim.converged) {
    details.push('Simulation did not converge within iteration cap')
  }

  Object.entries(target.lights ?? {}).forEach(([lightId, expected]) => {
    const actual = sim.lights[lightId] ?? false
    if (actual !== expected) {
      success = false
      details.push(`Light ${lightId} expected ${expected}, got ${actual}`)
    }
  })

  Object.entries(target.outputs ?? {}).forEach(([portId, expected]) => {
    const actual = sim.outputs[portId] ?? false
    if (actual !== expected) {
      success = false
      details.push(`Output ${portId} expected ${expected}, got ${actual}`)
    }
  })

  return { success, details }
}
