import { makeId } from './ids'
import type { GateNode, GateType, JunctionNode, LightNode, Position, SwitchNode } from './types'

const DEFAULT_WIDTH = 140
const DEFAULT_HEIGHT = 80
const JUNCTION_WIDTH = 60
const JUNCTION_HEIGHT = 40

export function createSwitchNode(position: Position): SwitchNode {
  const id = makeId('switch')
  const outputPortId = makeId('port')
  return {
    id,
    type: 'switch',
    position,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    data: {
      state: false,
      outputPortId,
      label: 'Switch',
    },
  }
}

export function createLightNode(position: Position): LightNode {
  const id = makeId('light')
  const inputPortId = makeId('port')
  return {
    id,
    type: 'light',
    position,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    data: {
      state: false,
      inputPortId,
    },
  }
}

export function createGateNode(gateType: GateType, position: Position): GateNode {
  const id = makeId('gate')
  const inputCount = gateType === 'NOT' ? 1 : 2
  const inputPortIds = Array.from({ length: inputCount }, (_, i) => makeId(`port-${i}`))
  const outputPortId = makeId('port-out')

  return {
    id,
    type: 'gate',
    position,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    data: {
      gateType,
      inputPortIds,
      outputPortId,
    },
  }
}

export function createJunctionNode(position: Position, data?: { label?: string }): JunctionNode {
  const id = makeId('junction')
  const inputPortId = makeId('port-in')
  const outputPortId = makeId('port-out')
  return {
    id,
    type: 'junction',
    position,
    width: JUNCTION_WIDTH,
    height: JUNCTION_HEIGHT,
    data: {
      label: data?.label,
      inputPortId,
      outputPortId,
    },
  }
}
