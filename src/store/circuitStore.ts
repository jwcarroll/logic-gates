import { createStore, produce } from 'solid-js/store';
import type {
  Circuit,
  CircuitNode,
  Wire,
  Position,
  SwitchNode,
  LightNode,
  GateNode,
  GateType,
  Port,
  DragState,
  WireDrawState,
  CanvasState,
} from '../types/circuit';
import { generateId } from '../utils/helpers';

const GATE_WIDTH = 80;
const GATE_HEIGHT = 60;
const SWITCH_WIDTH = 60;
const SWITCH_HEIGHT = 40;
const LIGHT_WIDTH = 40;
const LIGHT_HEIGHT = 40;

function createPort(nodeId: string, type: 'input' | 'output', index: number): Port {
  return {
    id: generateId(),
    nodeId,
    type,
    index,
    position: { x: 0, y: 0 },
  };
}

function getInputCount(gateType: GateType): number {
  return gateType === 'NOT' ? 1 : 2;
}

export function createSwitch(position: Position): SwitchNode {
  const id = generateId();
  return {
    id,
    type: 'switch',
    position,
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    state: false,
    outputPort: createPort(id, 'output', 0),
  };
}

export function createLight(position: Position): LightNode {
  const id = generateId();
  return {
    id,
    type: 'light',
    position,
    width: LIGHT_WIDTH,
    height: LIGHT_HEIGHT,
    state: false,
    inputPort: createPort(id, 'input', 0),
  };
}

export function createGate(position: Position, gateType: GateType): GateNode {
  const id = generateId();
  const inputCount = getInputCount(gateType);
  return {
    id,
    type: 'gate',
    gateType,
    position,
    width: GATE_WIDTH,
    height: GATE_HEIGHT,
    inputPorts: Array.from({ length: inputCount }, (_, i) => createPort(id, 'input', i)),
    outputPort: createPort(id, 'output', 0),
  };
}

function evaluateGate(gateType: GateType, inputs: boolean[]): boolean {
  switch (gateType) {
    case 'AND':
      return inputs.every(Boolean);
    case 'OR':
      return inputs.some(Boolean);
    case 'NOT':
      return !inputs[0];
    case 'NAND':
      return !inputs.every(Boolean);
    case 'NOR':
      return !inputs.some(Boolean);
    case 'XOR':
      return inputs.filter(Boolean).length % 2 === 1;
    case 'XNOR':
      return inputs.filter(Boolean).length % 2 === 0;
    default:
      return false;
  }
}

function createCircuitStore() {
  const [circuit, setCircuit] = createStore<Circuit>({
    nodes: [],
    wires: [],
  });

  const [dragState, setDragState] = createStore<DragState>({
    isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0 },
  });

  const [wireDrawState, setWireDrawState] = createStore<WireDrawState>({
    isDrawing: false,
    fromPort: null,
    currentPosition: null,
  });

  const [canvasState, setCanvasState] = createStore<CanvasState>({
    pan: { x: 0, y: 0 },
    zoom: 1,
  });

  const [selectedNodeId, setSelectedNodeId] = createStore<{ id: string | null }>({ id: null });

  function addNode(node: CircuitNode) {
    setCircuit('nodes', (nodes) => [...nodes, node]);
  }

  function removeNode(nodeId: string) {
    setCircuit(
      produce((c) => {
        c.wires = c.wires.filter((w) => w.fromNodeId !== nodeId && w.toNodeId !== nodeId);
        c.nodes = c.nodes.filter((n) => n.id !== nodeId);
      })
    );
    propagateSignals();
  }

  function updateNodePosition(nodeId: string, position: Position) {
    setCircuit(
      'nodes',
      (n) => n.id === nodeId,
      'position',
      position
    );
  }

  function toggleSwitch(nodeId: string) {
    setCircuit(
      'nodes',
      (n) => n.id === nodeId && n.type === 'switch',
      'state' as any,
      (state: boolean) => !state
    );
    propagateSignals();
  }

  function addWire(fromPortId: string, toPortId: string) {
    const fromPort = findPort(fromPortId);
    const toPort = findPort(toPortId);

    if (!fromPort || !toPort) return;
    if (fromPort.type === toPort.type) return;
    if (fromPort.nodeId === toPort.nodeId) return;

    // Ensure we're connecting output to input
    const [outputPort, inputPort] =
      fromPort.type === 'output' ? [fromPort, toPort] : [toPort, fromPort];

    // Check if input port already has a connection
    const existingWire = circuit.wires.find((w) => w.toPortId === inputPort.id);
    if (existingWire) {
      // Remove existing wire
      setCircuit('wires', (wires) => wires.filter((w) => w.id !== existingWire.id));
    }

    const wire: Wire = {
      id: generateId(),
      fromPortId: outputPort.id,
      toPortId: inputPort.id,
      fromNodeId: outputPort.nodeId,
      toNodeId: inputPort.nodeId,
    };

    setCircuit('wires', (wires) => [...wires, wire]);
    propagateSignals();
  }

  function removeWire(wireId: string) {
    setCircuit('wires', (wires) => wires.filter((w) => w.id !== wireId));
    propagateSignals();
  }

  function findPort(portId: string): Port | null {
    for (const node of circuit.nodes) {
      if (node.type === 'switch' && node.outputPort.id === portId) {
        return node.outputPort;
      }
      if (node.type === 'light' && node.inputPort.id === portId) {
        return node.inputPort;
      }
      if (node.type === 'gate') {
        if (node.outputPort.id === portId) return node.outputPort;
        const inputPort = node.inputPorts.find((p) => p.id === portId);
        if (inputPort) return inputPort;
      }
    }
    return null;
  }

  function getPortPosition(port: Port): Position {
    const node = circuit.nodes.find((n) => n.id === port.nodeId);
    if (!node) return { x: 0, y: 0 };

    if (node.type === 'switch') {
      return {
        x: node.position.x + node.width,
        y: node.position.y + node.height / 2,
      };
    }

    if (node.type === 'light') {
      return {
        x: node.position.x,
        y: node.position.y + node.height / 2,
      };
    }

    if (node.type === 'gate') {
      if (port.type === 'output') {
        return {
          x: node.position.x + node.width,
          y: node.position.y + node.height / 2,
        };
      } else {
        const inputCount = node.inputPorts.length;
        const spacing = node.height / (inputCount + 1);
        return {
          x: node.position.x,
          y: node.position.y + spacing * (port.index + 1),
        };
      }
    }

    return { x: 0, y: 0 };
  }

  function propagateSignals() {
    // Build a map of node outputs
    const nodeOutputs = new Map<string, boolean>();

    // Initialize switches
    for (const node of circuit.nodes) {
      if (node.type === 'switch') {
        nodeOutputs.set(node.outputPort.id, node.state);
      }
    }

    // Topological sort and propagation
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const node of circuit.nodes) {
        if (node.type === 'gate') {
          // Get input values
          const inputValues: boolean[] = node.inputPorts.map((port) => {
            const wire = circuit.wires.find((w) => w.toPortId === port.id);
            if (!wire) return false;
            return nodeOutputs.get(wire.fromPortId) ?? false;
          });

          const output = evaluateGate(node.gateType, inputValues);
          const currentOutput = nodeOutputs.get(node.outputPort.id);

          if (currentOutput !== output) {
            nodeOutputs.set(node.outputPort.id, output);
            changed = true;
          }
        }
      }
    }

    // Update light states
    setCircuit(
      produce((c) => {
        for (const node of c.nodes) {
          if (node.type === 'light') {
            const wire = c.wires.find((w) => w.toPortId === node.inputPort.id);
            node.state = wire ? (nodeOutputs.get(wire.fromPortId) ?? false) : false;
          }
        }
      })
    );
  }

  function getWireState(wire: Wire): boolean {
    const fromNode = circuit.nodes.find((n) => n.id === wire.fromNodeId);
    if (!fromNode) return false;

    if (fromNode.type === 'switch') {
      return fromNode.state;
    }

    // For gates, we need to trace back
    if (fromNode.type === 'gate') {
      return evaluateGateOutput(fromNode);
    }

    return false;
  }

  function evaluateGateOutput(gate: GateNode): boolean {
    const inputValues: boolean[] = gate.inputPorts.map((port) => {
      const wire = circuit.wires.find((w) => w.toPortId === port.id);
      if (!wire) return false;
      const sourceNode = circuit.nodes.find((n) => n.id === wire.fromNodeId);
      if (!sourceNode) return false;
      if (sourceNode.type === 'switch') return sourceNode.state;
      if (sourceNode.type === 'gate') return evaluateGateOutput(sourceNode);
      return false;
    });
    return evaluateGate(gate.gateType, inputValues);
  }

  function clearCircuit() {
    setCircuit({ nodes: [], wires: [] });
  }

  return {
    circuit,
    dragState,
    wireDrawState,
    canvasState,
    selectedNodeId,
    setDragState,
    setWireDrawState,
    setCanvasState,
    setSelectedNodeId,
    addNode,
    removeNode,
    updateNodePosition,
    toggleSwitch,
    addWire,
    removeWire,
    findPort,
    getPortPosition,
    propagateSignals,
    getWireState,
    clearCircuit,
  };
}

export const circuitStore = createCircuitStore();
