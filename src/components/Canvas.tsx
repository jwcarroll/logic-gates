import { For, createSignal, onMount, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import type { Position, GateType, Port } from '../types/circuit';
import { circuitStore, createSwitch, createLight, createGate } from '../store/circuitStore';
import { Switch } from './Switch';
import { Light } from './Light';
import { Gate } from './Gate';
import { Wire, WirePreview } from './Wire';
import { Toolbar } from './Toolbar';

interface ActivePointer {
  id: number;
  x: number;
  y: number;
}

export const Canvas: Component = () => {
  let svgRef: SVGSVGElement | undefined;
  const [wireStart, setWireStart] = createSignal<{ port: Port; pos: Position } | null>(null);
  const [mousePos, setMousePos] = createSignal<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragNodeId, setDragNodeId] = createSignal<string | null>(null);
  const [dragOffset, setDragOffset] = createSignal<Position>({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = createSignal<string | null>(null);

  // Touch gesture state for pan/zoom
  const [pan, setPan] = createSignal<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = createSignal(1);
  const [activePointers, setActivePointers] = createSignal<ActivePointer[]>([]);
  const [lastPinchDistance, setLastPinchDistance] = createSignal<number | null>(null);
  const [lastPinchCenter, setLastPinchCenter] = createSignal<Position | null>(null);
  const [isPanning, setIsPanning] = createSignal(false);

  const getSvgPoint = (e: PointerEvent | MouseEvent): Position => {
    if (!svgRef) return { x: 0, y: 0 };
    const rect = svgRef.getBoundingClientRect();
    const currentZoom = zoom();
    const currentPan = pan();
    return {
      x: (e.clientX - rect.left - currentPan.x) / currentZoom,
      y: (e.clientY - rect.top - currentPan.y) / currentZoom,
    };
  };

  const getDistance = (p1: ActivePointer, p2: ActivePointer): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getMidpoint = (p1: ActivePointer, p2: ActivePointer): Position => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  };

  const handlePointerDown = (e: PointerEvent) => {
    // Track this pointer
    const pointer: ActivePointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
    setActivePointers(prev => [...prev.filter(p => p.id !== e.pointerId), pointer]);

    const pointers = activePointers();
    if (pointers.length >= 2) {
      // Two fingers down - start pan/pinch gesture
      setIsPanning(true);
      setIsDragging(false);
      setDragNodeId(null);
      const [p1, p2] = pointers;
      setLastPinchDistance(getDistance(p1, p2));
      setLastPinchCenter(getMidpoint(p1, p2));
    }
  };

  const handleAddSwitch = () => {
    const node = createSwitch({ x: 100, y: 100 + Math.random() * 200 });
    circuitStore.addNode(node);
  };

  const handleAddLight = () => {
    // Use viewport-relative position to ensure visibility on mobile
    const canvasWidth = svgRef?.clientWidth ?? 800;
    const node = createLight({ x: Math.min(300, canvasWidth - 100), y: 100 + Math.random() * 200 });
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

  const handleStartDrag = (nodeId: string, clientPos: Position) => {
    // Don't start drag if we're in a multi-touch gesture
    if (activePointers().length >= 2) return;

    // Calculate offset accounting for pan/zoom transform
    const node = circuitStore.circuit.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const currentZoom = zoom();
    const currentPan = pan();
    // screenPos = nodePos * zoom + pan, so offset = clientPos - screenPos
    const offset = {
      x: clientPos.x - (node.position.x * currentZoom + currentPan.x),
      y: clientPos.y - (node.position.y * currentZoom + currentPan.y),
    };

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
    // Update this pointer's position in activePointers
    setActivePointers(prev => prev.map(p =>
      p.id === e.pointerId ? { ...p, x: e.clientX, y: e.clientY } : p
    ));

    const pointers = activePointers();

    // Handle two-finger pan and pinch-to-zoom
    if (pointers.length >= 2 && isPanning()) {
      const [p1, p2] = pointers;
      const currentDistance = getDistance(p1, p2);
      const currentCenter = getMidpoint(p1, p2);

      const prevDistance = lastPinchDistance();
      const prevCenter = lastPinchCenter();

      if (prevDistance !== null && prevCenter !== null) {
        // Calculate zoom change
        const zoomDelta = currentDistance / prevDistance;
        const newZoom = Math.max(0.25, Math.min(4, zoom() * zoomDelta));

        // Calculate pan change (movement of the center point)
        const panDeltaX = currentCenter.x - prevCenter.x;
        const panDeltaY = currentCenter.y - prevCenter.y;

        // Apply zoom around the pinch center
        const rect = svgRef?.getBoundingClientRect();
        if (rect) {
          const currentPan = pan();
          const currentZoom = zoom();

          // Adjust pan to zoom around the pinch center
          const zoomPointX = currentCenter.x - rect.left;
          const zoomPointY = currentCenter.y - rect.top;

          const newPanX = zoomPointX - (zoomPointX - currentPan.x) * (newZoom / currentZoom) + panDeltaX;
          const newPanY = zoomPointY - (zoomPointY - currentPan.y) * (newZoom / currentZoom) + panDeltaY;

          setPan({ x: newPanX, y: newPanY });
          setZoom(newZoom);
        }
      }

      setLastPinchDistance(currentDistance);
      setLastPinchCenter(currentCenter);
      return; // Don't process as regular pointer move
    }

    const point = getSvgPoint(e);
    setMousePos(point);

    if (isDragging() && dragNodeId() && !isPanning()) {
      const offset = dragOffset();
      const currentZoom = zoom();
      const currentPan = pan();
      // newPos = (clientPos - offset - pan) / zoom
      circuitStore.updateNodePosition(dragNodeId()!, {
        x: (e.clientX - offset.x - currentPan.x) / currentZoom,
        y: (e.clientY - offset.y - currentPan.y) / currentZoom,
      });
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    // Remove this pointer from tracking
    setActivePointers(prev => prev.filter(p => p.id !== e.pointerId));

    const remainingPointers = activePointers();
    if (remainingPointers.length < 2) {
      // Reset pinch state when we no longer have 2 fingers
      setIsPanning(false);
      setLastPinchDistance(null);
      setLastPinchCenter(null);
    }

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
          onPointerDown={handlePointerDown}
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

          {/* Transformed content group for pan/zoom */}
          <g transform={`translate(${pan().x}, ${pan().y}) scale(${zoom()})`}>
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
          </g>
        </svg>
      </div>
    </div>
  );
};
