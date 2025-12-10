import type { Circuit } from '../../core/types'
import type { ChallengeTarget } from '../../core/commands/challengeCommands'
import { evaluateChallenge } from '../../core/commands/challengeCommands'

export interface ChallengeDefinition {
  id: string
  title: string
  description: string
  starterCircuit: Circuit
  target: ChallengeTarget
}

const challengeLibrary: ChallengeDefinition[] = [
  {
    id: 'xor-light',
    title: 'Exclusive Lamp',
    description: 'Turn the lamp on when exactly one input is active.',
    starterCircuit: {
      id: 'challenge-xor-circuit',
      nodes: [
        {
          id: 'challenge-switch-a',
          type: 'switch',
          position: { x: 120, y: 120 },
          width: 140,
          height: 80,
          data: { state: false, outputPortId: 'port-switch-a', label: 'Input A' },
        },
        {
          id: 'challenge-switch-b',
          type: 'switch',
          position: { x: 120, y: 240 },
          width: 140,
          height: 80,
          data: { state: false, outputPortId: 'port-switch-b', label: 'Input B' },
        },
        {
          id: 'challenge-xor',
          type: 'gate',
          position: { x: 360, y: 180 },
          width: 140,
          height: 80,
          data: { gateType: 'XOR', inputPortIds: ['port-xor-in-0', 'port-xor-in-1'], outputPortId: 'port-xor-out' },
        },
        {
          id: 'challenge-light',
          type: 'light',
          position: { x: 600, y: 180 },
          width: 140,
          height: 80,
          data: { state: false, inputPortId: 'port-light-in' },
        },
      ],
      wires: [
        {
          id: 'wire-switch-a',
          source: 'port-switch-a',
          sourceNode: 'challenge-switch-a',
          target: 'port-xor-in-0',
          targetNode: 'challenge-xor',
        },
        {
          id: 'wire-switch-b',
          source: 'port-switch-b',
          sourceNode: 'challenge-switch-b',
          target: 'port-xor-in-1',
          targetNode: 'challenge-xor',
        },
        {
          id: 'wire-xor-out',
          source: 'port-xor-out',
          sourceNode: 'challenge-xor',
          target: 'port-light-in',
          targetNode: 'challenge-light',
        },
      ],
    },
    target: {
      lights: {
        'challenge-light': true,
      },
    },
  },
]

function cloneCircuit(circuit: Circuit): Circuit {
  return structuredClone ? structuredClone(circuit) : JSON.parse(JSON.stringify(circuit))
}

export function listChallenges(): ChallengeDefinition[] {
  return challengeLibrary.map((c) => ({ ...c, starterCircuit: cloneCircuit(c.starterCircuit) }))
}

export function getChallengeById(id: string): ChallengeDefinition | undefined {
  const found = challengeLibrary.find((c) => c.id === id)
  if (!found) return undefined
  return { ...found, starterCircuit: cloneCircuit(found.starterCircuit) }
}

export function evaluateChallengeRun(circuit: Circuit, target: ChallengeTarget) {
  return evaluateChallenge(circuit, target)
}
