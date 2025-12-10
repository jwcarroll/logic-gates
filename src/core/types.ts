export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR'

export type NodeKind = 'switch' | 'gate' | 'light' | 'group'
export type PortKind = 'input' | 'output'

export interface Position {
  x: number
  y: number
}

export interface Port {
  id: string
  nodeId: string
  kind: PortKind
  index: number
  position?: Position
}

export interface BaseNode {
  id: string
  type: NodeKind
  position: Position
  width: number
  height: number
  groupId?: string
}

export interface SwitchNode extends BaseNode {
  type: 'switch'
  data: {
    state: boolean
    outputPortId: string
    label?: string
  }
}

export interface GateNode extends BaseNode {
  type: 'gate'
  data: {
    gateType: GateType
    inputPortIds: string[]
    outputPortId: string
  }
}

export interface LightNode extends BaseNode {
  type: 'light'
  data: {
    state: boolean
    inputPortId: string
  }
}

export interface GroupNode extends BaseNode {
  type: 'group'
  data: {
    label: string
    childNodeIds: string[]
    inputPortIds: string[]
    outputPortIds: string[]
    collapsed: boolean
    portMap: GroupPortMap
  }
}

export type CircuitNode = SwitchNode | GateNode | LightNode | GroupNode

export interface Wire {
  id: string
  source: string // port id
  target: string // port id
  sourceNode: string
  targetNode: string
}

export interface CircuitMetadata {
  name?: string
  createdAt?: string
}

export interface Circuit {
  id?: string
  nodes: CircuitNode[]
  wires: Wire[]
  metadata?: CircuitMetadata
}

export interface SimulationResult {
  outputs: Record<string, boolean>
  lights: Record<string, boolean>
  iterations: number
  converged: boolean
  errors?: string[]
}

export interface GroupPortMap {
  inputs: Record<string, string> // group port id -> internal port id
  outputs: Record<string, string> // group port id -> internal port id
}

export interface Result<T> {
  ok: boolean
  value?: T
  errors?: string[]
}
