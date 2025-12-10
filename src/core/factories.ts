import { makeId } from './ids'
import type { GateNode, GateType, LightNode, Position, SwitchNode } from './types'

const DEFAULT_WIDTH = 140
const DEFAULT_HEIGHT = 80

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
