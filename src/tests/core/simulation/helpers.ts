import { createGateNode, createLightNode, createSwitchNode } from '../../../core/factories'
import type { Circuit, GateType, SwitchNode } from '../../../core/types'
import { simulate } from '../../../core/simulation'

export function buildGateCircuit(gateType: GateType): {
  circuit: Circuit
  inputs: SwitchNode[]
  gateOutputId: string
  lightInputId: string
  lightNodeId: string
} {
  const s1 = createSwitchNode({ x: 0, y: 0 })
  const s2 = createSwitchNode({ x: 0, y: 50 })
  const gate = createGateNode(gateType, { x: 150, y: 0 })
  const light = createLightNode({ x: 300, y: 0 })

  const wires = [
    wire(s1.id, s1.data.outputPortId, gate.id, gate.data.inputPortIds[0]),
    ...(gate.data.inputPortIds[1]
      ? [wire(s2.id, s2.data.outputPortId, gate.id, gate.data.inputPortIds[1])]
      : []),
    wire(gate.id, gate.data.outputPortId, light.id, light.data.inputPortId),
  ]

  const circuit: Circuit = {
    nodes: [s1, ...(gate.data.inputPortIds[1] ? [s2] : []), gate, light],
    wires,
  }

  return {
    circuit,
    inputs: gate.data.inputPortIds[1] ? [s1, s2] : [s1],
    gateOutputId: gate.data.outputPortId,
    lightInputId: light.data.inputPortId,
    lightNodeId: light.id,
  }
}

export function setInputs(inputs: SwitchNode[], states: boolean[]) {
  inputs.forEach((sw, idx) => {
    sw.data.state = states[idx]
  })
}

export function getOutput(circuit: Circuit, portId: string): boolean {
  return simulate(circuit).outputs[portId] ?? false
}

export function getLight(circuit: Circuit, nodeId: string): boolean {
  return simulate(circuit).lights[nodeId] ?? false
}

function wire(sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) {
  return {
    id: `${sourcePortId}->${targetPortId}`,
    source: sourcePortId,
    target: targetPortId,
    sourceNode: sourceNodeId,
    targetNode: targetNodeId,
  }
}
