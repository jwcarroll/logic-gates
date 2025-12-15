import { readFileSync } from 'fs'
import { join } from 'path'
import { performance } from 'perf_hooks'
import { describe, expect, it } from 'vitest'
import { deleteSelection } from '../../../core/commands'
import { simulate } from '../../../core/simulation'
import type { Circuit, GateNode, LightNode, SwitchNode, Wire } from '../../../core/types'

const fixturePath = join(__dirname, '..', '..', 'fixtures', 'perf-delete-selection-100x200.json')
const config = JSON.parse(readFileSync(fixturePath, 'utf-8')) as { nodes: number; wires: number; selectionItems: number }

function makeId(prefix: string, idx: number) {
  return `${prefix}-${idx}`
}

function buildPerfCircuit(): Circuit {
  const numSwitches = Math.max(10, Math.floor(config.nodes * 0.25))
  const numLights = Math.max(10, Math.floor(config.nodes * 0.25))
  const numGates = Math.max(1, config.nodes - numSwitches - numLights)
  const inputsPerGate = 2

  const switches: SwitchNode[] = Array.from({ length: numSwitches }, (_, i) => ({
    id: makeId('switch', i),
    type: 'switch',
    position: { x: 50, y: 50 + i * 30 },
    width: 120,
    height: 70,
    data: { state: Boolean(i % 2), outputPortId: makeId('port-s-out', i) },
  }))

  const gates: GateNode[] = Array.from({ length: numGates }, (_, i) => ({
    id: makeId('gate', i),
    type: 'gate',
    position: { x: 260, y: 50 + i * 25 },
    width: 140,
    height: 80,
    data: {
      gateType: i % 2 === 0 ? 'AND' : 'OR',
      inputPortIds: [makeId(`port-g-${i}-in`, 0), makeId(`port-g-${i}-in`, 1)],
      outputPortId: makeId(`port-g-${i}-out`, 0),
    },
  }))

  const lights: LightNode[] = Array.from({ length: numLights }, (_, i) => ({
    id: makeId('light', i),
    type: 'light',
    position: { x: 560, y: 50 + i * 30 },
    width: 120,
    height: 70,
    data: { state: false, inputPortId: makeId('port-l-in', i) },
  }))

  const nodes = [...switches, ...gates, ...lights]
  const wires: Wire[] = []

  const outputPorts: { portId: string; nodeId: string }[] = [
    ...switches.map((s) => ({ portId: s.data.outputPortId, nodeId: s.id })),
  ]

  // Feed gates from switches/previous gates (build up outputs).
  for (const gate of gates) {
    for (const input of gate.data.inputPortIds) {
      if (wires.length >= config.wires) break
      const src = outputPorts[wires.length % outputPorts.length]!
      wires.push({
        id: makeId('wire', wires.length),
        source: src.portId,
        sourceNode: src.nodeId,
        target: input,
        targetNode: gate.id,
      })
    }
    outputPorts.push({ portId: gate.data.outputPortId, nodeId: gate.id })
    if (wires.length >= config.wires) break
  }

  // Feed lights from accumulated outputs.
  for (const light of lights) {
    if (wires.length >= config.wires) break
    const src = outputPorts[wires.length % outputPorts.length]!
    wires.push({
      id: makeId('wire', wires.length),
      source: src.portId,
      sourceNode: src.nodeId,
      target: light.data.inputPortId,
      targetNode: light.id,
    })
  }

  // If still short, add more gate->gate wires (valid: output to input).
  while (wires.length < config.wires && gates.length > 1) {
    const sourceGate = gates[wires.length % gates.length]!
    const targetGate = gates[(wires.length + 1) % gates.length]!
    wires.push({
      id: makeId('wire', wires.length),
      source: sourceGate.data.outputPortId,
      sourceNode: sourceGate.id,
      target: targetGate.data.inputPortIds[wires.length % inputsPerGate]!,
      targetNode: targetGate.id,
    })
  }

  return { nodes, wires }
}

describe('Perf regression - delete selection 100x200', () => {
  it('deletes a mixed selection quickly', () => {
    const circuit = buildPerfCircuit()
    expect(circuit.nodes.length).toBeGreaterThanOrEqual(config.nodes - 2)
    expect(circuit.wires.length).toBeGreaterThanOrEqual(Math.min(config.wires, circuit.nodes.length))

    const selectedNodeIds = circuit.nodes
      .filter((n) => n.type !== 'junction')
      .slice(0, Math.max(10, Math.floor(config.selectionItems / 2)))
      .map((n) => n.id)
    const selectedWireIds = circuit.wires.slice(0, Math.max(10, config.selectionItems - selectedNodeIds.length)).map((w) => w.id)

    const start = performance.now()
    const result = deleteSelection(circuit, { nodeIds: selectedNodeIds, wireIds: selectedWireIds })
    const sim = simulate(result.circuit)
    const duration = performance.now() - start

    console.log(`[workspace-perf] deleteSelection ${duration.toFixed(2)}ms (nodes=${circuit.nodes.length}, wires=${circuit.wires.length}, selection=${selectedNodeIds.length + selectedWireIds.length})`)

    expect(sim.converged).toBe(true)
    expect(sim.iterations).toBeLessThanOrEqual(100)
    expect(duration).toBeLessThan(50)
  })
})

