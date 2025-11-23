import { For, createSignal, onMount, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import type { Position, GateType, Port } from '../types/circuit';
import { circuitStore, createSwitch, createLight, createGate } from '../store/circuitStore';
import { Switch } from './Switch';
import { Light } from './Light';
import { Gate } from './Gate';
import { Wire, WirePreview } from './Wire';
import { Toolbar } from './Toolbar';

export const Canvas: Component = () => {
  let svgRef: SVGSVGElement | undefined;
  const [wireStart, setWireStart] = createSignal<{ port: Port; pos: Position } | null>(null);
  const [mousePos, setMousePos] = createSignal<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragNodeId, setDragNodeId] = createSignal<string | null>(null);
  const [dragOffset, setDragOffset] = createSignal<Position>({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = createSignal<string | null>(null);

  const getSvgPoint = (e: PointerEvent | MouseEvent): Position => {
    if (!svgRef) return { x: 0, y: 0 };
    const rect = svgRef.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleAddSwitch = () => {
    const node = createSwitch({ x: 100, y: 100 + Math.random() * 200 });
    circuitStore.addNode(node);
  };

  const handleAddLight = () => {
    const node = createLight({ x: 500, y: 100 + Math.random() * 200 });
    circuitStore.addNode(node);
  };

  const handleAddGate = (gateType: GateType) => {
    const node = createGate({ x: 300, y: 100 + Math.random() * 200 }, gateType);
    circuitStore.addNode(node);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all components?')) {
      circuitStore.clearCircuit();
      setSelectedId(null);
    }
  };

  const handleDeleteSelected = () => {
    const id = selectedId();
    if (id) {
      circuitStore.removeNode(id);
      setSelectedId(null);
    }
  };

  const handleStartDrag = (nodeId: string, offset: Position) => {
    setIsDragging(true);
    setDragNodeId(nodeId);
    setDragOffset(offset);
    setSelectedId(nodeId);
  };

  const handlePortClick = (portId: string, nodeId: string, type: 'input' | 'output') => {
    const port = circuitStore.findPort(portId);
    if (!port) return;

    const currentWireStart = wireStart();

    if (currentWireStart === null) {
      // Start drawing a wire
      const pos = circuitStore.getPortPosition(port);
      setWireStart({ port, pos });
    } else {
      // Complete the wire
      if (currentWireStart.port.type !== type && currentWireStart.port.nodeId !== nodeId) {
        circuitStore.addWire(currentWireStart.port.id, portId);
      }
      setWireStart(null);
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    const point = getSvgPoint(e);
    setMousePos(point);

    if (isDragging() && dragNodeId()) {
      const offset = dragOffset();
      circuitStore.updateNodePosition(dragNodeId()!, {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragNodeId(null);
  };

  const handleCanvasClick = (e: PointerEvent | MouseEvent) => {
    if (e.target === svgRef) {
      setSelectedId(null);
      setWireStart(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const id = selectedId();
      if (id) {
        circuitStore.removeNode(id);
        setSelectedId(null);
      }
    }
    if (e.key === 'Escape') {
      setWireStart(null);
      setSelectedId(null);
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div class="app-container">
      <Toolbar
        onAddSwitch={handleAddSwitch}
        onAddLight={handleAddLight}
        onAddGate={handleAddGate}
        onClear={handleClear}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={selectedId() !== null}
      />
      <div class="canvas-container">
        <svg
          ref={svgRef}
          class="circuit-canvas"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleCanvasClick}
          style={{ "touch-action": "none" }}
        >
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#2a2a2a"
                stroke-width="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#1a1a1a" />
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Wires */}
          <For each={circuitStore.circuit.wires}>
            {(wire) => (
              <Wire wire={wire} onDelete={(id) => circuitStore.removeWire(id)} />
            )}
          </For>

          {/* Wire preview while drawing */}
          {wireStart() && (
            <WirePreview from={wireStart()!.pos} to={mousePos()} />
          )}

          {/* Nodes */}
          <For each={circuitStore.circuit.nodes}>
            {(node) => {
              if (node.type === 'switch') {
                return (
                  <Switch
                    node={node}
                    onStartDrag={handleStartDrag}
                    onPortClick={handlePortClick}
                    isSelected={selectedId() === node.id}
                  />
                );
              }
              if (node.type === 'light') {
                return (
                  <Light
                    node={node}
                    onStartDrag={handleStartDrag}
                    onPortClick={handlePortClick}
                    isSelected={selectedId() === node.id}
                  />
                );
              }
              if (node.type === 'gate') {
                return (
                  <Gate
                    node={node}
                    onStartDrag={handleStartDrag}
                    onPortClick={handlePortClick}
                    isSelected={selectedId() === node.id}
                  />
                );
              }
              return null;
            }}
          </For>
        </svg>
      </div>
    </div>
  );
};
