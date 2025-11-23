export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

export interface Position {
  x: number;
  y: number;
}

export interface Port {
  id: string;
  nodeId: string;
  type: 'input' | 'output';
  index: number;
  position: Position;
}

export interface BaseNode {
  id: string;
  position: Position;
  width: number;
  height: number;
}

export interface SwitchNode extends BaseNode {
  type: 'switch';
  state: boolean;
  outputPort: Port;
}

export interface LightNode extends BaseNode {
  type: 'light';
  state: boolean;
  inputPort: Port;
}

export interface GateNode extends BaseNode {
  type: 'gate';
  gateType: GateType;
  inputPorts: Port[];
  outputPort: Port;
}

export type CircuitNode = SwitchNode | LightNode | GateNode;

export interface Wire {
  id: string;
  fromPortId: string;
  toPortId: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface Circuit {
  nodes: CircuitNode[];
  wires: Wire[];
}

export interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  offset: Position;
}

export interface WireDrawState {
  isDrawing: boolean;
  fromPort: Port | null;
  currentPosition: Position | null;
}

export interface CanvasState {
  pan: Position;
  zoom: number;
}
