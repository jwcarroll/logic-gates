import { createStore, produce } from 'solid-js/store';
import type {
  Circuit,
  CircuitNode,
  Wire,
  Position,
  SwitchNode,
  LightNode,
  GateNode,
  GroupNode,
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

  const [selectedNodeIds, setSelectedNodeIds] = createStore<{ ids: string[] }>({ ids: [] });

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

  function addWire(fromPortId: string, toPortId: string): boolean {
    const fromPort = findPort(fromPortId);
    const toPort = findPort(toPortId);

    if (!fromPort || !toPort) return false;
    if (fromPort.nodeId === toPort.nodeId) return false;

    const fromNode = circuit.nodes.find((n) => n.id === fromPort.nodeId);
    const toNode = circuit.nodes.find((n) => n.id === toPort.nodeId);

    if (!fromNode || !toNode) return false;

    const isChildConnection = (parent: CircuitNode, child: CircuitNode) =>
      parent.type === 'group' && child.type !== 'group' && parent.childNodeIds.includes(child.id);

    let outputPort: Port | null = null;
    let inputPort: Port | null = null;

    if (fromPort.type !== toPort.type) {
      // Standard connection rules
      [outputPort, inputPort] = fromPort.type === 'output' ? [fromPort, toPort] : [toPort, fromPort];
    } else {
      // Allow group boundary mapping even when port types match
      if (isChildConnection(fromNode, toNode)) {
        // Connecting from group port to its child
        outputPort = fromPort.type === 'input' ? fromPort : toPort;
        inputPort = fromPort.type === 'input' ? toPort : fromPort;
      } else if (isChildConnection(toNode, fromNode)) {
        // Connecting from child to its parent group port
        outputPort = fromPort.type === 'input' ? toPort : fromPort;
        inputPort = fromPort.type === 'input' ? fromPort : toPort;
      }
    }

    // If we still don't have a valid output/input pair, abort
    if (!outputPort || !inputPort) return false;

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
    return true;
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
      if (node.type === 'group') {
        const inputPort = node.inputPorts.find((p) => p.id === portId);
        if (inputPort) return inputPort;
        const outputPort = node.outputPorts.find((p) => p.id === portId);
        if (outputPort) return outputPort;
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

    if (node.type === 'group') {
      const portCount = port.type === 'input' ? node.inputPorts.length : node.outputPorts.length;
      const legacyY = node.height / (portCount + 1) * (port.index + 1);
      const relativeY = port.position?.y || legacyY;
      return {
        x: port.type === 'input' ? node.position.x : node.position.x + node.width,
        y: node.position.y + relativeY,
      };
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
        } else if (node.type === 'group') {
          // Evaluate group: propagate inputs through internal circuit to outputs
          // 1. Set group input port values from incoming wires
          const groupInputValues = new Map<string, boolean>();
          for (const inputPort of node.inputPorts) {
            const wire = circuit.wires.find((w) => w.toPortId === inputPort.id);
            const value = wire ? (nodeOutputs.get(wire.fromPortId) ?? false) : false;
            groupInputValues.set(inputPort.id, value);
          }

          // 2. Find internal wires connecting to group inputs
          // Map group input ports to their connected internal node ports
          const internalInputWires = circuit.wires.filter((w) =>
            node.inputPorts.some((p) => p.id === w.fromPortId) &&
            node.childNodeIds.includes(w.toNodeId)
          );

          // 3. Propagate values through internal circuit
          const internalOutputs = new Map<string, boolean>();

          // Initialize internal switches (if any)
          for (const childId of node.childNodeIds) {
            const child = circuit.nodes.find((n) => n.id === childId);
            if (child && child.type === 'switch') {
              internalOutputs.set(child.outputPort.id, child.state);
            }
          }

          // Set values from group inputs
          for (const wire of internalInputWires) {
            const groupInputPort = node.inputPorts.find((p) => p.id === wire.fromPortId);
            if (groupInputPort) {
              const value = groupInputValues.get(groupInputPort.id) ?? false;
              internalOutputs.set(wire.fromPortId, value);
            }
          }

          // Evaluate internal gates
          let internalChanged = true;
          let internalIter = 0;
          while (internalChanged && internalIter < 20) {
            internalChanged = false;
            internalIter++;

            for (const childId of node.childNodeIds) {
              const child = circuit.nodes.find((n) => n.id === childId);
              if (child && child.type === 'gate') {
                const childInputValues: boolean[] = child.inputPorts.map((port) => {
                  const wire = circuit.wires.find((w) => w.toPortId === port.id);
                  if (!wire) return false;
                  return internalOutputs.get(wire.fromPortId) ?? false;
                });

                const childOutput = evaluateGate(child.gateType, childInputValues);
                const currentChildOutput = internalOutputs.get(child.outputPort.id);

                if (currentChildOutput !== childOutput) {
                  internalOutputs.set(child.outputPort.id, childOutput);
                  internalChanged = true;
                }
              }
            }
          }

          // 4. Set group output port values based on internal wires
          for (const outputPort of node.outputPorts) {
            // Find wire connecting internal node to this group output
            const wire = circuit.wires.find((w) =>
              w.toPortId === outputPort.id &&
              node.childNodeIds.includes(w.fromNodeId)
            );

            if (wire) {
              const value = internalOutputs.get(wire.fromPortId) ?? false;
              const currentValue = nodeOutputs.get(outputPort.id);

              if (currentValue !== value) {
                nodeOutputs.set(outputPort.id, value);
                changed = true;
              }
            }
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

  function exportCircuit(): string {
    const exportData = {
      version: '1.0',
      circuit: {
        nodes: circuit.nodes,
        wires: circuit.wires,
      },
    };
    return JSON.stringify(exportData, null, 2);
  }

  function importCircuit(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);

      // Validate structure
      if (!data.circuit || !Array.isArray(data.circuit.nodes) || !Array.isArray(data.circuit.wires)) {
        return { success: false, error: 'Invalid circuit data structure' };
      }

      // Basic validation of nodes
      for (const node of data.circuit.nodes) {
        if (!node.id || !node.type || !node.position) {
          return { success: false, error: 'Invalid node data' };
        }
        if (node.type === 'switch' && !node.outputPort) {
          return { success: false, error: 'Invalid switch node' };
        }
        if (node.type === 'light' && !node.inputPort) {
          return { success: false, error: 'Invalid light node' };
        }
        if (node.type === 'gate' && (!node.gateType || !node.inputPorts || !node.outputPort)) {
          return { success: false, error: 'Invalid gate node' };
        }
        if (node.type === 'group' && (!node.childNodeIds || !node.inputPorts || !node.outputPorts)) {
          return { success: false, error: 'Invalid group node' };
        }
      }

      // Basic validation of wires
      for (const wire of data.circuit.wires) {
        if (!wire.id || !wire.fromPortId || !wire.toPortId || !wire.fromNodeId || !wire.toNodeId) {
          return { success: false, error: 'Invalid wire data' };
        }
      }

      // Import the circuit
      setCircuit(data.circuit);
      propagateSignals();

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to parse JSON' };
    }
  }

  // Selection management
  function toggleSelection(nodeId: string) {
    setSelectedNodeIds(
      produce((state) => {
        const index = state.ids.indexOf(nodeId);
        if (index >= 0) {
          state.ids.splice(index, 1);
        } else {
          state.ids.push(nodeId);
        }
      })
    );
  }

  function setSelection(nodeIds: string[]) {
    setSelectedNodeIds({ ids: nodeIds });
  }

  function clearSelection() {
    setSelectedNodeIds({ ids: [] });
  }

  // Group operations
  function createGroupFromSelected(label: string = 'Group'): string | null {
    const selectedIds = selectedNodeIds.ids;
    if (selectedIds.length < 1) return null;

    // Get all selected nodes
    const selectedNodes = circuit.nodes.filter((n) => selectedIds.includes(n.id));

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of selectedNodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.width);
      maxY = Math.max(maxY, node.position.y + node.height);
    }

    const padding = 20;
    const groupPosition = { x: minX - padding, y: minY - padding };
    const groupWidth = maxX - minX + padding * 2;
    const groupHeight = maxY - minY + padding * 2;

    // Create group node with NO ports initially
    // User will add ports manually by dragging wires to edges
    const groupId = generateId();

    const group: GroupNode = {
      id: groupId,
      type: 'group',
      label,
      position: groupPosition,
      width: groupWidth,
      height: groupHeight,
      childNodeIds: selectedIds,
      collapsed: true,
      inputPorts: [],
      outputPorts: [],
    };

    // Remove any external wires (they will be reconnected manually)
    setCircuit(
      produce((c) => {
        // Add group node
        c.nodes.push(group);

        // Remove wires that cross the group boundary
        c.wires = c.wires.filter((wire) => {
          const fromInGroup = selectedIds.includes(wire.fromNodeId);
          const toInGroup = selectedIds.includes(wire.toNodeId);
          // Keep only wires that are fully internal or fully external
          return (fromInGroup && toInGroup) || (!fromInGroup && !toInGroup);
        });
      })
    );

    clearSelection();
    setSelection([groupId]);
    return groupId;
  }

  function ungroupNode(groupId: string) {
    const group = circuit.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
    if (!group) return;

    setCircuit(
      produce((c) => {
        // Collect port mappings (we need to trace which group port maps to which internal port)
        // For now, we'll remove the group and its external wires
        // A more sophisticated implementation would preserve the wire connections

        // Remove wires connected to this group
        c.wires = c.wires.filter((w) => w.fromNodeId !== groupId && w.toNodeId !== groupId);

        // Remove the group node
        c.nodes = c.nodes.filter((n) => n.id !== groupId);
      })
    );

    // Select the ungrouped nodes
    setSelection(group.childNodeIds);
  }

  function toggleGroupCollapse(groupId: string) {
    setCircuit(
      'nodes',
      (n) => n.id === groupId && n.type === 'group',
      'collapsed' as any,
      (collapsed: boolean) => !collapsed
    );
  }

  function cloneGroup(groupId: string): string | null {
    const group = circuit.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
    if (!group) return null;

    // Create ID mappings for cloned nodes
    const idMapping = new Map<string, string>();
    group.childNodeIds.forEach((oldId) => {
      idMapping.set(oldId, generateId());
    });

    // Clone child nodes
    const clonedNodes: CircuitNode[] = [];
    for (const childId of group.childNodeIds) {
      const originalNode = circuit.nodes.find((n) => n.id === childId);
      if (!originalNode) continue;

      const newId = idMapping.get(childId)!;
      const offset = 50; // Offset cloned group

      if (originalNode.type === 'switch') {
        const cloned: SwitchNode = {
          ...originalNode,
          id: newId,
          position: { x: originalNode.position.x + offset, y: originalNode.position.y + offset },
          outputPort: { ...originalNode.outputPort, id: generateId(), nodeId: newId },
        };
        clonedNodes.push(cloned);
      } else if (originalNode.type === 'light') {
        const cloned: LightNode = {
          ...originalNode,
          id: newId,
          position: { x: originalNode.position.x + offset, y: originalNode.position.y + offset },
          inputPort: { ...originalNode.inputPort, id: generateId(), nodeId: newId },
        };
        clonedNodes.push(cloned);
      } else if (originalNode.type === 'gate') {
        const cloned: GateNode = {
          ...originalNode,
          id: newId,
          position: { x: originalNode.position.x + offset, y: originalNode.position.y + offset },
          inputPorts: originalNode.inputPorts.map((p) => ({ ...p, id: generateId(), nodeId: newId })),
          outputPort: { ...originalNode.outputPort, id: generateId(), nodeId: newId },
        };
        clonedNodes.push(cloned);
      }
    }

    // Clone internal wires
    const clonedWires: Wire[] = [];
    for (const wire of circuit.wires) {
      if (group.childNodeIds.includes(wire.fromNodeId) && group.childNodeIds.includes(wire.toNodeId)) {
        // This is an internal wire
        const fromNode = clonedNodes.find((n) => n.id === idMapping.get(wire.fromNodeId));
        const toNode = clonedNodes.find((n) => n.id === idMapping.get(wire.toNodeId));

        if (fromNode && toNode) {
          let fromPortId = '';
          let toPortId = '';

          if (fromNode.type === 'switch') {
            fromPortId = fromNode.outputPort.id;
          } else if (fromNode.type === 'gate') {
            fromPortId = fromNode.outputPort.id;
          }

          if (toNode.type === 'light') {
            toPortId = toNode.inputPort.id;
          } else if (toNode.type === 'gate') {
            const originalToNode = circuit.nodes.find((n) => n.id === wire.toNodeId);
            if (originalToNode && originalToNode.type === 'gate') {
              const originalPort = originalToNode.inputPorts.find((p) => p.id === wire.toPortId);
              if (originalPort && toNode.type === 'gate') {
                toPortId = toNode.inputPorts[originalPort.index].id;
              }
            }
          }

          if (fromPortId && toPortId) {
            clonedWires.push({
              id: generateId(),
              fromPortId,
              toPortId,
              fromNodeId: fromNode.id,
              toNodeId: toNode.id,
            });
          }
        }
      }
    }

    // Create cloned group
    const newGroupId = generateId();
    const offset = 50;
    const clonedGroup: GroupNode = {
      ...group,
      id: newGroupId,
      position: { x: group.position.x + offset, y: group.position.y + offset },
      childNodeIds: clonedNodes.map((n) => n.id),
      inputPorts: group.inputPorts.map((p, i) => ({ ...p, id: generateId(), nodeId: newGroupId, index: i })),
      outputPorts: group.outputPorts.map((p, i) => ({ ...p, id: generateId(), nodeId: newGroupId, index: i })),
    };

    // Add cloned nodes, wires, and group to circuit
    setCircuit(
      produce((c) => {
        c.nodes.push(...clonedNodes);
        c.wires.push(...clonedWires);
        c.nodes.push(clonedGroup);
      })
    );

    propagateSignals();
    setSelection([newGroupId]);
    return newGroupId;
  }

  function updateGroupPositions(groupId: string, deltaX: number, deltaY: number) {
    const group = circuit.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
    if (!group) return;

    setCircuit(
      produce((c) => {
        // Update child node positions
        for (const childId of group.childNodeIds) {
          const node = c.nodes.find((n) => n.id === childId);
          if (node) {
            node.position.x += deltaX;
            node.position.y += deltaY;
          }
        }
      })
    );
  }

  function addGroupPort(groupId: string, type: 'input' | 'output', relativeY: number): Port | null {
    const group = circuit.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
    if (!group) return null;

    // Clamp the Y position within the group bounds (leaving small padding)
    const clampedY = Math.max(10, Math.min(relativeY, group.height - 10));

    const newPort: Port = {
      id: generateId(),
      nodeId: groupId,
      type,
      index: type === 'input' ? group.inputPorts.length : group.outputPorts.length,
      position: { x: 0, y: clampedY },
    };

    setCircuit(
      produce((c) => {
        const g = c.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
        if (!g) return;

        if (type === 'input') {
          g.inputPorts.push(newPort);
        } else {
          g.outputPorts.push(newPort);
        }
      })
    );

    return newPort;
  }

  function removeGroupPort(groupId: string, portId: string): boolean {
    const group = circuit.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
    if (!group) return false;

    setCircuit(
      produce((c) => {
        const g = c.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
        if (!g) return;

        // Remove port from group
        g.inputPorts = g.inputPorts.filter((p) => p.id !== portId);
        g.outputPorts = g.outputPorts.filter((p) => p.id !== portId);

        // Re-index remaining ports
        g.inputPorts.forEach((p, i) => (p.index = i));
        g.outputPorts.forEach((p, i) => (p.index = i));

        // Remove any wires connected to this port
        c.wires = c.wires.filter((w) => w.fromPortId !== portId && w.toPortId !== portId);
      })
    );

    propagateSignals();
    return true;
  }

  function resizeGroup(groupId: string, width: number, height: number): boolean {
    const group = circuit.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
    if (!group) return false;

    // Enforce minimum size
    const minWidth = 100;
    const minHeight = 80;

    setCircuit(
      produce((c) => {
        const g = c.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
        if (!g) return;

        g.width = Math.max(minWidth, width);
        g.height = Math.max(minHeight, height);
      })
    );

    return true;
  }

  function createEmptyGroup(position: Position, label: string = 'Group'): string {
    const groupId = generateId();
    const group: GroupNode = {
      id: groupId,
      type: 'group',
      label,
      position,
      width: 200,
      height: 150,
      childNodeIds: [],
      collapsed: false,
      inputPorts: [],
      outputPorts: [],
    };

    setCircuit(
      produce((c) => {
        c.nodes.push(group);
      })
    );

    setSelection([groupId]);
    return groupId;
  }

  function addNodeToGroup(nodeId: string, groupId: string): boolean {
    const node = circuit.nodes.find((n) => n.id === nodeId);
    const group = circuit.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;

    if (!node || !group || node.type === 'group') return false;

    // Don't add if already a child of this or another group
    const isAlreadyChild = circuit.nodes.some(
      (n) => n.type === 'group' && n.childNodeIds.includes(nodeId)
    );
    if (isAlreadyChild) return false;

    setCircuit(
      produce((c) => {
        const g = c.nodes.find((n) => n.id === groupId && n.type === 'group') as GroupNode | undefined;
        if (!g) return;

        g.childNodeIds.push(nodeId);
      })
    );

    return true;
  }

  function removeNodeFromGroup(nodeId: string): boolean {
    setCircuit(
      produce((c) => {
        for (const node of c.nodes) {
          if (node.type === 'group') {
            const index = node.childNodeIds.indexOf(nodeId);
            if (index >= 0) {
              node.childNodeIds.splice(index, 1);
              return;
            }
          }
        }
      })
    );

    return true;
  }

  return {
    circuit,
    dragState,
    wireDrawState,
    canvasState,
    selectedNodeIds,
    setDragState,
    setWireDrawState,
    setCanvasState,
    setSelectedNodeIds,
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
    exportCircuit,
    importCircuit,
    toggleSelection,
    setSelection,
    clearSelection,
    createGroupFromSelected,
    ungroupNode,
    toggleGroupCollapse,
    cloneGroup,
    updateGroupPositions,
    addGroupPort,
    removeGroupPort,
    resizeGroup,
    createEmptyGroup,
    addNodeToGroup,
    removeNodeFromGroup,
  };
}

export const circuitStore = createCircuitStore();
