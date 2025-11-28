import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { GroupNode, Position } from '../types/circuit';
import { circuitStore } from '../store/circuitStore';
import { Switch } from './Switch';
import { Light } from './Light';
import { Gate } from './Gate';
import { Wire } from './Wire';

interface GroupProps {
  node: GroupNode;
  onStartDrag: (nodeId: string, clientPos: Position, isMultiSelect?: boolean) => void;
  onPortClick: (portId: string, nodeId: string, type: 'input' | 'output') => void;
  isSelected: boolean;
}

export const Group: Component<GroupProps> = (props) => {
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

      {/* Child nodes - only render when expanded */}
      <Show when={!props.node.collapsed}>
        <g class="group-children">
          {/* Internal wires (between child nodes) */}
          <For each={circuitStore.circuit.wires.filter(wire =>
            props.node.childNodeIds.includes(wire.fromNodeId) &&
            props.node.childNodeIds.includes(wire.toNodeId)
          )}>
            {(wire) => (
              <Wire wire={wire} onDelete={(id) => circuitStore.removeWire(id)} />
            )}
          </For>

          {/* Child nodes */}
          <For each={props.node.childNodeIds}>
            {(childId) => {
              const childNode = circuitStore.circuit.nodes.find(n => n.id === childId);
              if (!childNode) return null;

              const isSelected = circuitStore.selectedNodeIds.ids.includes(childId);

              // Render child in absolute position (they already have correct positions)
              // We translate back by group position since they're inside the group's transform
              const relativeX = childNode.position.x - props.node.position.x;
              const relativeY = childNode.position.y - props.node.position.y;

              if (childNode.type === 'switch') {
                return (
                  <g transform={`translate(${relativeX}, ${relativeY})`}>
                    <Switch
                      node={{ ...childNode, position: { x: 0, y: 0 } }}
                      onStartDrag={props.onStartDrag}
                      onPortClick={props.onPortClick}
                      isSelected={isSelected}
                    />
                  </g>
                );
              }
              if (childNode.type === 'light') {
                return (
                  <g transform={`translate(${relativeX}, ${relativeY})`}>
                    <Light
                      node={{ ...childNode, position: { x: 0, y: 0 } }}
                      onStartDrag={props.onStartDrag}
                      onPortClick={props.onPortClick}
                      isSelected={isSelected}
                    />
                  </g>
                );
              }
              if (childNode.type === 'gate') {
                return (
                  <g transform={`translate(${relativeX}, ${relativeY})`}>
                    <Gate
                      node={{ ...childNode, position: { x: 0, y: 0 } }}
                      onStartDrag={props.onStartDrag}
                      onPortClick={props.onPortClick}
                      isSelected={isSelected}
                    />
                  </g>
                );
              }
              return null;
            }}
          </For>
        </g>
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
    </g>
  );
};
