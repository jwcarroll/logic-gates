import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { GateNode, GroupNode, LightNode, Position, SwitchNode, Wire as WireType } from '../types/circuit';
import { circuitStore } from '../store/circuitStore';
import { Switch } from './Switch';
import { Light } from './Light';
import { Gate } from './Gate';

interface GroupProps {
  node: GroupNode;
  onStartDrag: (nodeId: string, clientPos: Position, isMultiSelect?: boolean) => void;
  onPortClick: (portId: string, nodeId: string, type: 'input' | 'output') => void;
  onStartResize: (nodeId: string, clientPos: Position) => void;
  isSelected: boolean;
}

export const Group: Component<GroupProps> = (props) => {
  const internalWires = () => circuitStore.circuit.wires.filter(wire =>
    props.node.childNodeIds.includes(wire.fromNodeId) &&
    props.node.childNodeIds.includes(wire.toNodeId)
  );

  const handlePointerDown = (e: PointerEvent) => {
    e.stopPropagation();

    // Check for Ctrl (Windows/Linux) or Meta (Mac) key for multi-selection
    const isMultiSelect = e.ctrlKey || e.metaKey;

    props.onStartDrag(props.node.id, { x: e.clientX, y: e.clientY }, isMultiSelect);
  };

  const handlePortClick = (e: PointerEvent, portId: string, type: 'input' | 'output') => {
    e.stopPropagation();

    // Ctrl/Cmd + Click to delete port
    if (e.ctrlKey || e.metaKey) {
      if (confirm('Delete this port? All connected wires will be removed.')) {
        circuitStore.removeGroupPort(props.node.id, portId);
      }
      return;
    }

    props.onPortClick(portId, props.node.id, type);
  };

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation();
    circuitStore.toggleGroupCollapse(props.node.id);
  };

  const getRelativePortPosition = (portId: string) => {
    const port = circuitStore.findPort(portId);
    if (!port) return { x: 0, y: 0 };
    const absolute = circuitStore.getPortPosition(port);
    return {
      x: absolute.x - props.node.position.x,
      y: absolute.y - props.node.position.y,
    };
  };

  const GroupWire: Component<{ wire: WireType; collapsed: boolean }> = (wireProps) => {
    const fromPos = () => getRelativePortPosition(wireProps.wire.fromPortId);
    const toPos = () => getRelativePortPosition(wireProps.wire.toPortId);
    const isActive = () => circuitStore.getWireState(wireProps.wire);

    const pathD = () => {
      const from = fromPos();
      const to = toPos();
      const midX = (from.x + to.x) / 2;
      return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
    };

    const handleContext = (e: MouseEvent) => {
      if (e.button === 2 && !wireProps.collapsed) {
        e.preventDefault();
        circuitStore.removeWire(wireProps.wire.id);
      }
    };

    const stroke = () => isActive() ? '#4ade80' : '#6b7280';
    const dash = () => wireProps.collapsed ? '6,6' : undefined;

    return (
      <g class="wire" onContextMenu={handleContext} pointer-events={wireProps.collapsed ? 'none' : undefined}>
        <path
          d={pathD()}
          fill="none"
          stroke="transparent"
          stroke-width={12}
        />
        <path
          d={pathD()}
          fill="none"
          stroke={stroke()}
          stroke-width={wireProps.collapsed ? 2 : 3}
          stroke-linecap="round"
          stroke-dasharray={dash()}
          opacity={wireProps.collapsed ? 0.8 : 1}
          class={isActive() ? 'wire-active' : 'wire-inactive'}
        />
      </g>
    );
  };

  const handleResizeStart = (e: PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    props.onStartResize(props.node.id, { x: e.clientX, y: e.clientY });
  };

  const handleEdgeClick = (e: PointerEvent, edge: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();

    // Get click position relative to SVG
    const rect = (e.target as SVGElement).ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;

    // Calculate Y position in group coordinates
    const svgY = e.clientY - rect.top;
    const groupY = svgY - props.node.position.y;

    // Add port at this Y position
    const portType = edge === 'left' ? 'input' : 'output';
    circuitStore.addGroupPort(props.node.id, portType, groupY);
  };

  return (
    <g transform={`translate(${props.node.position.x}, ${props.node.position.y})`}>
      {/* Group boundary */}
      <rect
        x={0}
        y={0}
        width={props.node.width}
        height={props.node.height}
        rx={12}
        fill="rgba(100, 150, 255, 0.1)"
        stroke={props.isSelected ? '#6ab0ff' : '#5588ff'}
        stroke-width={props.isSelected ? 3 : 2}
        stroke-dasharray={props.node.collapsed ? '0' : '5,5'}
        onPointerDown={handlePointerDown}
        onDblClick={handleDoubleClick}
        style={{ cursor: 'move' }}
      />

      {/* Clickable edges for adding ports - only show when not collapsed */}
      {!props.node.collapsed && (
        <>
          {/* Left edge - for input ports */}
          <rect
            x={-5}
            y={0}
            width={10}
            height={props.node.height}
            fill="transparent"
            stroke="rgba(74, 222, 128, 0.3)"
            stroke-width={2}
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => handleEdgeClick(e, 'left')}
          />
          {/* Right edge - for output ports */}
          <rect
            x={props.node.width - 5}
            y={0}
            width={10}
            height={props.node.height}
            fill="transparent"
            stroke="rgba(248, 113, 113, 0.3)"
            stroke-width={2}
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => handleEdgeClick(e, 'right')}
          />
        </>
      )}

      {/* Group label */}
      <text
        x={props.node.width / 2}
        y={20}
        text-anchor="middle"
        fill="#fff"
        font-size="14"
        font-weight="bold"
        pointer-events="none"
      >
        {props.node.label}
      </text>

      {/* Collapsed indicator */}
      {props.node.collapsed && (
        <text
          x={props.node.width / 2}
          y={props.node.height / 2 + 5}
          text-anchor="middle"
          fill="#aaa"
          font-size="12"
          pointer-events="none"
        >
          (Double-click to expand)
        </text>
      )}

      {/* Child nodes and internal wires */}
      <g class="group-children">
        <For each={internalWires()}>
          {(wire) => (
            <GroupWire wire={wire} collapsed={props.node.collapsed} />
          )}
        </For>

        <Show when={!props.node.collapsed}>
          <For each={props.node.childNodeIds}>
            {(childId) => {
              const childNode = () => circuitStore.circuit.nodes.find(n => n.id === childId);
              if (!childNode()) return null;

              const isSelected = () => circuitStore.selectedNodeIds.ids.includes(childId);

              // Render child in absolute position (they already have correct positions)
              // We translate back by group position since they're inside the group's transform
              const relativeX = () => childNode()!.position.x - props.node.position.x;
              const relativeY = () => childNode()!.position.y - props.node.position.y;

              if (childNode()!.type === 'switch') {
                const node = childNode() as SwitchNode;
                return (
                  <g transform={`translate(${relativeX()}, ${relativeY()})`}>
                    <Switch
                      node={{ ...node, position: { x: 0, y: 0 } }}
                      onStartDrag={props.onStartDrag}
                      onPortClick={props.onPortClick}
                      isSelected={isSelected()}
                    />
                  </g>
                );
              }
              if (childNode()!.type === 'light') {
                const node = childNode() as LightNode;
                return (
                  <g transform={`translate(${relativeX()}, ${relativeY()})`}>
                    <Light
                      node={{ ...node, position: { x: 0, y: 0 } }}
                      onStartDrag={props.onStartDrag}
                      onPortClick={props.onPortClick}
                      isSelected={isSelected()}
                    />
                  </g>
                );
              }
              if (childNode()!.type === 'gate') {
                const node = childNode() as GateNode;
                return (
                  <g transform={`translate(${relativeX()}, ${relativeY()})`}>
                    <Gate
                      node={{ ...node, position: { x: 0, y: 0 } }}
                      onStartDrag={props.onStartDrag}
                      onPortClick={props.onPortClick}
                      isSelected={isSelected()}
                    />
                  </g>
                );
              }
              return null;
            }}
          </For>
        </Show>
      </g>

      {/* Internal wire summary while collapsed */}
      <Show when={props.node.collapsed && internalWires().length > 0}>
        <text
          x={props.node.width / 2}
          y={props.node.height - 12}
          text-anchor="middle"
          fill="#9ca3af"
          font-size="12"
          pointer-events="none"
        >
          {internalWires().length} internal connection{internalWires().length === 1 ? '' : 's'}
        </text>
      </Show>

      {/* Input ports */}
      <For each={props.node.inputPorts}>
        {(port) => {
          const pos = circuitStore.getPortPosition(port);
          const relativeY = pos.y - props.node.position.y;
          return (
            <>
              <circle
                cx={0}
                cy={relativeY}
                r={6}
                fill="#4ade80"
                stroke="#fff"
                stroke-width={2}
              />
              {/* Touch target */}
              <circle
                cx={0}
                cy={relativeY}
                r={18}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => handlePortClick(e, port.id, 'input')}
              />
            </>
          );
        }}
      </For>

      {/* Output ports */}
      <For each={props.node.outputPorts}>
        {(port) => {
          const pos = circuitStore.getPortPosition(port);
          const relativeY = pos.y - props.node.position.y;
          return (
            <>
              <circle
                cx={props.node.width}
                cy={relativeY}
                r={6}
                fill="#f87171"
                stroke="#fff"
                stroke-width={2}
              />
              {/* Touch target */}
              <circle
                cx={props.node.width}
                cy={relativeY}
                r={18}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => handlePortClick(e, port.id, 'output')}
              />
            </>
          );
        }}
      </For>

      {/* Resize handle - bottom right corner */}
      <g class="resize-handle">
        {/* Larger invisible touch target */}
        <rect
          x={props.node.width - 20}
          y={props.node.height - 20}
          width={20}
          height={20}
          fill="transparent"
          style={{ cursor: 'nwse-resize' }}
          onPointerDown={handleResizeStart}
        />
        {/* Visible resize indicator */}
        <path
          d={`M ${props.node.width - 12} ${props.node.height - 4} L ${props.node.width - 4} ${props.node.height - 12} M ${props.node.width - 8} ${props.node.height - 4} L ${props.node.width - 4} ${props.node.height - 8}`}
          stroke={props.isSelected ? '#6ab0ff' : '#888'}
          stroke-width={2}
          stroke-linecap="round"
          pointer-events="none"
        />
      </g>
    </g>
  );
};
