import { For, createSignal, onMount, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import type { Position, GateType, Port } from '../types/circuit';
import { circuitStore, createSwitch, createLight, createGate } from '../store/circuitStore';
import { Switch } from './Switch';
import { Light } from './Light';
import { Gate } from './Gate';
import { Group } from './Group';
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

  // Selection box state
  const [isSelectingBox, setIsSelectingBox] = createSignal(false);
  const [selectionBoxStart, setSelectionBoxStart] = createSignal<Position | null>(null);
  const [selectionBoxEnd, setSelectionBoxEnd] = createSignal<Position | null>(null);

  // Group edge hover state (for creating ports)
  const [hoveredGroupEdge, setHoveredGroupEdge] = createSignal<{ groupId: string; edge: 'left' | 'right'; y: number } | null>(null);

  // Group resize state
  const [isResizing, setIsResizing] = createSignal(false);
  const [resizeGroupId, setResizeGroupId] = createSignal<string | null>(null);
  const [resizeStartSize, setResizeStartSize] = createSignal<{ width: number; height: number } | null>(null);
  const [resizeStartPos, setResizeStartPos] = createSignal<Position | null>(null);

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
    } else {
      // Check if clicking on a circuit node (components call stopPropagation, so this means we clicked on empty space)
      // This will be true for clicks on background, grid, or transform group - all non-interactive elements
      const target = e.target as Element;
      const isClickingOnNode = target.classList?.contains('circuit-node') ||
                                target.closest('.circuit-node') ||
                                target.classList?.contains('port-touch-target');

      if (!isClickingOnNode) {
        // Clicking on canvas background - start selection box
        const point = getSvgPoint(e);
        setSelectionBoxStart(point);
        setSelectionBoxEnd(point);
        setIsSelectingBox(true);
      }
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

  const handleAddGroup = () => {
    circuitStore.createEmptyGroup({ x: 200, y: 100 + Math.random() * 200 });
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all components?')) {
      circuitStore.clearCircuit();
      circuitStore.clearSelection();
    }
  };

  const handleDeleteSelected = () => {
    const ids = circuitStore.selectedNodeIds.ids;
    if (ids.length > 0) {
      ids.forEach(id => circuitStore.removeNode(id));
      circuitStore.clearSelection();
    }
  };

  const handleCreateGroup = () => {
    const ids = circuitStore.selectedNodeIds.ids;
    if (ids.length >= 2) {
      const label = prompt('Enter group name:', 'Group');
      if (label !== null) {
        circuitStore.createGroupFromSelected(label || 'Group');
      }
    } else {
      alert('Please select at least 2 components to group');
    }
  };

  const handleUngroup = () => {
    const ids = circuitStore.selectedNodeIds.ids;
    if (ids.length === 1) {
      const node = circuitStore.circuit.nodes.find(n => n.id === ids[0]);
      if (node?.type === 'group') {
        circuitStore.ungroupNode(ids[0]);
      } else {
        alert('Please select a group to ungroup');
      }
    } else {
      alert('Please select exactly one group to ungroup');
    }
  };

  const handleCloneGroup = () => {
    const ids = circuitStore.selectedNodeIds.ids;
    if (ids.length === 1) {
      const node = circuitStore.circuit.nodes.find(n => n.id === ids[0]);
      if (node?.type === 'group') {
        circuitStore.cloneGroup(ids[0]);
      } else {
        alert('Please select a group to clone');
      }
    } else {
      alert('Please select exactly one group to clone');
    }
  };

  const handleToggleCollapse = () => {
    const ids = circuitStore.selectedNodeIds.ids;
    if (ids.length === 1) {
      const node = circuitStore.circuit.nodes.find(n => n.id === ids[0]);
      if (node?.type === 'group') {
        circuitStore.toggleGroupCollapse(ids[0]);
      } else {
        alert('Please select a group to collapse/expand');
      }
    } else {
      alert('Please select exactly one group to collapse/expand');
    }
  };

  const handleExport = () => {
    try {
      const jsonData = circuitStore.exportCircuit();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logic-circuit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export circuit: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = circuitStore.importCircuit(content);
        if (!result.success) {
          alert('Failed to import circuit: ' + result.error);
        }
      } catch (error) {
        alert('Failed to read file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
  };

  const handleStartDrag = (nodeId: string, clientPos: Position, isMultiSelect: boolean = false) => {
    // Don't start drag if we're in a multi-touch gesture or resizing
    if (activePointers().length >= 2 || isResizing()) return;

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

    // Handle multi-selection with Ctrl/Cmd key
    if (isMultiSelect) {
      circuitStore.toggleSelection(nodeId);
    } else {
      // If clicking on an already selected node, keep the current selection
      // Otherwise, select only this node
      if (!circuitStore.selectedNodeIds.ids.includes(nodeId)) {
        circuitStore.setSelection([nodeId]);
      }
    }
  };

  const handleStartResize = (groupId: string, clientPos: Position) => {
    // Don't start resize if we're in a multi-touch gesture or dragging
    if (activePointers().length >= 2 || isDragging()) return;

    const group = circuitStore.circuit.nodes.find(n => n.id === groupId && n.type === 'group');
    if (!group || group.type !== 'group') return;

    setIsResizing(true);
    setResizeGroupId(groupId);
    setResizeStartSize({ width: group.width, height: group.height });
    setResizeStartPos({ x: clientPos.x, y: clientPos.y });
  };

  const handlePortClick = (portId: string, _nodeId: string, _type: 'input' | 'output') => {
    const port = circuitStore.findPort(portId);
    if (!port) return;

    const currentWireStart = wireStart();

    if (currentWireStart === null) {
      // Start drawing a wire
      const pos = circuitStore.getPortPosition(port);
      setWireStart({ port, pos });
    } else {
      // Complete the wire
      circuitStore.addWire(currentWireStart.port.id, portId);
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

    // Check if hovering over a group edge while drawing wire
    if (wireStart()) {
      const edgeThreshold = 20; // pixels from edge to trigger
      let foundEdge = false;

      for (const node of circuitStore.circuit.nodes) {
        if (node.type === 'group') {
          const leftEdgeX = node.position.x;
          const rightEdgeX = node.position.x + node.width;
          const topY = node.position.y;
          const bottomY = node.position.y + node.height;

          // Check if mouse is near left or right edge and within vertical bounds
          if (point.y >= topY && point.y <= bottomY) {
            const distToLeft = Math.abs(point.x - leftEdgeX);
            const distToRight = Math.abs(point.x - rightEdgeX);

            if (distToLeft < edgeThreshold) {
              setHoveredGroupEdge({ groupId: node.id, edge: 'left', y: point.y });
              foundEdge = true;
              break;
            } else if (distToRight < edgeThreshold) {
              setHoveredGroupEdge({ groupId: node.id, edge: 'right', y: point.y });
              foundEdge = true;
              break;
            }
          }
        }
      }

      if (!foundEdge) {
        setHoveredGroupEdge(null);
      }
    } else {
      setHoveredGroupEdge(null);
    }

    // Update selection box if active
    if (isSelectingBox()) {
      setSelectionBoxEnd(point);
      return;
    }

    // Handle group resizing
    if (isResizing() && resizeGroupId()) {
      const startPos = resizeStartPos();
      const startSize = resizeStartSize();
      if (startPos && startSize) {
        const currentZoom = zoom();
        const deltaX = (e.clientX - startPos.x) / currentZoom;
        const deltaY = (e.clientY - startPos.y) / currentZoom;

        const newWidth = startSize.width + deltaX;
        const newHeight = startSize.height + deltaY;

        circuitStore.resizeGroup(resizeGroupId()!, newWidth, newHeight);
      }
      return;
    }

    if (isDragging() && dragNodeId() && !isPanning()) {
      const offset = dragOffset();
      const currentZoom = zoom();
      const currentPan = pan();
      const newPos = {
        x: (e.clientX - offset.x - currentPan.x) / currentZoom,
        y: (e.clientY - offset.y - currentPan.y) / currentZoom,
      };

      const draggedNode = circuitStore.circuit.nodes.find(n => n.id === dragNodeId()!);
      if (draggedNode?.type === 'group') {
        // When dragging a group, calculate delta from current position (not start position)
        const deltaX = newPos.x - draggedNode.position.x;
        const deltaY = newPos.y - draggedNode.position.y;

        // Only update if there's actual movement
        if (deltaX !== 0 || deltaY !== 0) {
          circuitStore.updateGroupPositions(dragNodeId()!, deltaX, deltaY);
        }
      }

      // Update the dragged node position
      circuitStore.updateNodePosition(dragNodeId()!, newPos);
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

    // Complete selection box if active
    if (isSelectingBox()) {
      const start = selectionBoxStart();
      const end = selectionBoxEnd();
      if (start && end) {
        // Calculate bounding box
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        // Check if this was just a click (tiny box) - threshold of 5 pixels
        const boxWidth = maxX - minX;
        const boxHeight = maxY - minY;
        const isClick = boxWidth < 5 && boxHeight < 5;

        if (isClick) {
          // Just a click on empty space - clear selection unless Ctrl/Cmd is pressed
          if (!e.ctrlKey && !e.metaKey) {
            circuitStore.clearSelection();
            setWireStart(null);
          }
        } else {
          // Actual drag - find all nodes within the selection box
          const selectedNodes = circuitStore.circuit.nodes.filter(node => {
            const nodeRight = node.position.x + node.width;
            const nodeBottom = node.position.y + node.height;
            return (
              node.position.x < maxX &&
              nodeRight > minX &&
              node.position.y < maxY &&
              nodeBottom > minY
            );
          });

          // Select nodes (check if Ctrl/Cmd is pressed for adding to selection)
          if (e.ctrlKey || e.metaKey) {
            // Add to existing selection
            const currentIds = circuitStore.selectedNodeIds.ids;
            const newIds = selectedNodes.map(n => n.id);
            const combinedIds = Array.from(new Set([...currentIds, ...newIds]));
            circuitStore.setSelection(combinedIds);
          } else {
            // Replace selection
            circuitStore.setSelection(selectedNodes.map(n => n.id));
          }
        }
      }

      setIsSelectingBox(false);
      setSelectionBoxStart(null);
      setSelectionBoxEnd(null);
    }

    // Handle completing wire to group edge
    if (wireStart() && hoveredGroupEdge()) {
      const edge = hoveredGroupEdge()!;
      const currentWireStart = wireStart()!;

      // Determine port type based on edge and wire start type
      const portType = edge.edge === 'left' ? 'input' : 'output';

      // Create port at the hovered position
      const group = circuitStore.circuit.nodes.find(n => n.id === edge.groupId && n.type === 'group');
      const relativeY = group ? edge.y - group.position.y : edge.y;
      const newPort = circuitStore.addGroupPort(edge.groupId, portType, relativeY);

      if (newPort) {
        // Connect wire to new port (will validate direction internally)
        circuitStore.addWire(currentWireStart.port.id, newPort.id);
      }

      setWireStart(null);
      setHoveredGroupEdge(null);
    }

    // Check if dragged node should be added to a group
    if (isDragging() && dragNodeId()) {
      const draggedNodeId = dragNodeId()!;
      const draggedNode = circuitStore.circuit.nodes.find(n => n.id === draggedNodeId);

      if (draggedNode && draggedNode.type !== 'group') {
        // Check if node is inside any group
        for (const node of circuitStore.circuit.nodes) {
          if (node.type === 'group' && !node.collapsed) {
            const nodeRight = draggedNode.position.x + draggedNode.width;
            const nodeBottom = draggedNode.position.y + draggedNode.height;
            const groupRight = node.position.x + node.width;
            const groupBottom = node.position.y + node.height;

            // Check if dragged node is completely inside the group
            if (
              draggedNode.position.x >= node.position.x &&
              nodeRight <= groupRight &&
              draggedNode.position.y >= node.position.y &&
              nodeBottom <= groupBottom
            ) {
              circuitStore.addNodeToGroup(draggedNodeId, node.id);
              break;
            }
          }
        }
      }
    }

    setIsDragging(false);
    setDragNodeId(null);
    setIsResizing(false);
    setResizeGroupId(null);
  };

  // Note: Selection clearing is now handled in handlePointerUp to work with selection box
  // This prevents interference between click and selection box logic

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const ids = circuitStore.selectedNodeIds.ids;
      if (ids.length > 0) {
        ids.forEach(id => circuitStore.removeNode(id));
        circuitStore.clearSelection();
      }
    }
    if (e.key === 'Escape') {
      setWireStart(null);
      circuitStore.clearSelection();
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
        onAddGroup={handleAddGroup}
        onClear={handleClear}
        onDeleteSelected={handleDeleteSelected}
        onCreateGroup={handleCreateGroup}
        onUngroup={handleUngroup}
        onCloneGroup={handleCloneGroup}
        onToggleCollapse={handleToggleCollapse}
        onExport={handleExport}
        onImport={handleImport}
        hasSelection={circuitStore.selectedNodeIds.ids.length > 0}
        selectedCount={circuitStore.selectedNodeIds.ids.length}
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
            {/* Wires - only render wires that are not internal to groups */}
            <For each={circuitStore.circuit.wires.filter(wire => {
              // Find if both nodes are children of the same group
              const groups = circuitStore.circuit.nodes.filter(n => n.type === 'group');
              const isInternalToGroup = groups.some(group =>
                group.type === 'group' &&
                group.childNodeIds.includes(wire.fromNodeId) &&
                group.childNodeIds.includes(wire.toNodeId)
              );
              return !isInternalToGroup;
            })}>
              {(wire) => (
                <Wire wire={wire} onDelete={(id) => circuitStore.removeWire(id)} />
              )}
            </For>

            {/* Wire preview while drawing */}
            {wireStart() && (
              <WirePreview from={wireStart()!.pos} to={mousePos()} />
            )}

            {/* Group edge hover indicator (shows where port will be created) */}
            {hoveredGroupEdge() && (() => {
              const edge = hoveredGroupEdge()!;
              const group = circuitStore.circuit.nodes.find(n => n.id === edge.groupId && n.type === 'group');
              if (!group || group.type !== 'group') return null;

              const x = edge.edge === 'left' ? group.position.x : group.position.x + group.width;
              const y = edge.y;

              return (
                <>
                  {/* Highlight line on edge */}
                  <line
                    x1={x}
                    y1={y - 20}
                    x2={x}
                    y2={y + 20}
                    stroke="#4ade80"
                    stroke-width={4}
                    stroke-linecap="round"
                    opacity={0.8}
                    pointer-events="none"
                  />
                  {/* Port preview circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={10}
                    fill="#4ade80"
                    stroke="#fff"
                    stroke-width={2}
                    opacity={0.6}
                    pointer-events="none"
                  />
                </>
              );
            })()}

            {/* Selection box */}
            {isSelectingBox() && selectionBoxStart() && selectionBoxEnd() && (
              <rect
                x={Math.min(selectionBoxStart()!.x, selectionBoxEnd()!.x)}
                y={Math.min(selectionBoxStart()!.y, selectionBoxEnd()!.y)}
                width={Math.abs(selectionBoxEnd()!.x - selectionBoxStart()!.x)}
                height={Math.abs(selectionBoxEnd()!.y - selectionBoxStart()!.y)}
                fill="rgba(74, 222, 128, 0.1)"
                stroke="#4ade80"
                stroke-width={2}
                stroke-dasharray="5,5"
                pointer-events="none"
              />
            )}

            {/* Nodes - only render top-level nodes (not children of groups) */}
            <For each={circuitStore.circuit.nodes.filter(node => {
              // Check if this node is a child of any group
              return !circuitStore.circuit.nodes.some(n =>
                n.type === 'group' && n.childNodeIds.includes(node.id)
              );
            })}>
              {(node) => {
                const isSelected = circuitStore.selectedNodeIds.ids.includes(node.id);

                if (node.type === 'switch') {
                  return (
                    <Switch
                      node={node}
                      onStartDrag={handleStartDrag}
                      onPortClick={handlePortClick}
                      isSelected={isSelected}
                    />
                  );
                }
                if (node.type === 'light') {
                  return (
                    <Light
                      node={node}
                      onStartDrag={handleStartDrag}
                      onPortClick={handlePortClick}
                      isSelected={isSelected}
                    />
                  );
                }
                if (node.type === 'gate') {
                  return (
                    <Gate
                      node={node}
                      onStartDrag={handleStartDrag}
                      onPortClick={handlePortClick}
                      isSelected={isSelected}
                    />
                  );
                }
                if (node.type === 'group') {
                  return (
                    <Group
                      node={node}
                      onStartDrag={handleStartDrag}
                      onPortClick={handlePortClick}
                      onStartResize={handleStartResize}
                      isSelected={isSelected}
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
