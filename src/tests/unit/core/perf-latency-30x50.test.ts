import { readFileSync } from 'fs'
import { join } from 'path'
import { performance } from 'perf_hooks'
import { describe, expect, it } from 'vitest'
import { simulate } from '../../../core/simulation'
import type { Circuit, GateNode, LightNode, SwitchNode } from '../../../core/types'

const fixturePath = join(__dirname, '..', '..', 'fixtures', 'perf-latency-30x50.json')
const config = JSON.parse(readFileSync(fixturePath, 'utf-8')) as { nodes: number; wires: number; depth: number }

function makeId(prefix: string, idx: number) {
  return `${prefix}-${idx}`
}

function buildPerfCircuit(): Circuit {
  const numSwitches = Math.max(5, Math.floor(config.nodes * 0.2))
  const numLights = Math.max(3, Math.floor(config.nodes * 0.15))
  const numGates = Math.max(1, config.nodes - numSwitches - numLights)
  const inputsPerGate = Math.max(2, Math.ceil((config.wires - numLights) / numGates))

  const switches: SwitchNode[] = Array.from({ length: numSwitches }, (_, i) => {
    const id = makeId('switch', i)
    return {
      id,
      type: 'switch',
      position: { x: 50, y: 50 + i * 40 },
      width: 120,
      height: 70,
      data: { state: Boolean(i % 2), outputPortId: makeId('port-s', i) },
    }
  })

  const gates: GateNode[] = Array.from({ length: numGates }, (_, i) => {
    const id = makeId('gate', i)
    const inputPortIds = Array.from({ length: inputsPerGate }, (__unused, idx) => makeId(`port-g-${i}-in`, idx))
    return {
      id,
      type: 'gate',
      position: { x: 200 + (i % config.depth) * 80, y: 50 + i * 30 },
      width: 140,
      height: 80,
      data: { gateType: i % 2 === 0 ? 'AND' : 'OR', inputPortIds, outputPortId: makeId(`port-g-${i}-out`, 0) },
    }
  })

  const lights: LightNode[] = Array.from({ length: numLights }, (_, i) => {
    const id = makeId('light', i)
    return {
      id,
      type: 'light',
      position: { x: 600, y: 50 + i * 60 },
      width: 120,
      height: 70,
      data: { state: false, inputPortId: makeId('port-l-in', i) },
    }
  })

  const circuit: Circuit = { nodes: [...switches, ...gates, ...lights], wires: [] }
  const outputs: string[] = switches.map((s) => s.data.outputPortId)

  // Wire switches/previous gate outputs into gate inputs until target reached
  for (const gate of gates) {
    for (const input of gate.data.inputPortIds) {
      if (circuit.wires.length >= config.wires) break
      const sourcePort = outputs[circuit.wires.length % outputs.length]
      const sourceNode = circuit.nodes.find((n) => (n.type === 'switch' ? n.data.outputPortId === sourcePort : (n as any).data.outputPortId === sourcePort))
      if (!sourceNode) continue
      circuit.wires.push({
        id: makeId('wire', circuit.wires.length),
        source: sourcePort,
        sourceNode: sourceNode.id,
        target: input,
        targetNode: gate.id,
      })
    }
    outputs.push(gate.data.outputPortId)
    if (circuit.wires.length >= config.wires) break
  }

  for (const light of lights) {
    if (circuit.wires.length >= config.wires) break
    const sourcePort = outputs[circuit.wires.length % outputs.length]
    const sourceNode = circuit.nodes.find((n) => (n.type === 'switch' ? n.data.outputPortId === sourcePort : (n as any).data.outputPortId === sourcePort))
    if (!sourceNode) continue
    circuit.wires.push({
      id: makeId('wire', circuit.wires.length),
      source: sourcePort,
      sourceNode: sourceNode.id,
      target: light.data.inputPortId,
      targetNode: light.id,
    })
  }

  return circuit
}

describe('Perf regression - latency 30x50', () => {
  it('simulates within iteration cap and time budget', () => {
    const circuit = buildPerfCircuit()
    expect(circuit.nodes.length).toBeGreaterThanOrEqual(config.nodes - 2)
    expect(circuit.wires.length).toBeGreaterThanOrEqual(Math.min(config.wires, circuit.nodes.length * 2))

    const start = performance.now()
    const result = simulate(circuit)
    const duration = performance.now() - start

    expect(result.converged).toBe(true)
    expect(result.iterations).toBeLessThanOrEqual(100)
    expect(duration).toBeLessThan(50)
  })
})
