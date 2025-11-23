import type { Component } from 'solid-js';
import type { SwitchNode, Position } from '../types/circuit';
import { circuitStore } from '../store/circuitStore';

interface SwitchProps {
  node: SwitchNode;
  onStartDrag: (nodeId: string, offset: Position) => void;
  onPortClick: (portId: string, nodeId: string, type: 'input' | 'output') => void;
  isSelected: boolean;
}

export const Switch: Component<SwitchProps> = (props) => {
  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);

    props.onStartDrag(props.node.id, {
      x: e.clientX - props.node.position.x,
      y: e.clientY - props.node.position.y,
    });
  };

  const handleToggle = (e: PointerEvent | MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    circuitStore.toggleSwitch(props.node.id);
  };

  return (
    <g
      transform={`translate(${props.node.position.x}, ${props.node.position.y})`}
      class="circuit-node switch-node"
      onPointerDown={handlePointerDown}
    >
      <rect
        x={0}
        y={0}
        width={props.node.width}
        height={props.node.height}
        rx={5}
        fill={props.isSelected ? '#4a90d9' : '#3a3a3a'}
        stroke={props.isSelected ? '#6ab0ff' : '#666'}
        stroke-width={2}
        class="node-body"
      />
      <rect
        x={5}
        y={5}
        width={props.node.width - 10}
        height={props.node.height - 10}
        rx={3}
        fill={props.node.state ? '#4ade80' : '#6b7280'}
        class="switch-toggle"
        style={{ cursor: 'pointer' }}
        onClick={handleToggle}
      />
      <text
        x={props.node.width / 2}
        y={props.node.height / 2 + 4}
        text-anchor="middle"
        fill="white"
        font-size="10"
        font-weight="bold"
        style={{ 'pointer-events': 'none' }}
      >
        {props.node.state ? 'ON' : 'OFF'}
      </text>
      {/* Output port */}
      <g class="port-group">
        {/* Invisible touch target */}
        <circle
          cx={props.node.width}
          cy={props.node.height / 2}
          r={18}
          fill="transparent"
          class="port-touch-target"
          style={{ cursor: 'crosshair' }}
          onClick={(e) => {
            e.stopPropagation();
            props.onPortClick(props.node.outputPort.id, props.node.id, 'output');
          }}
        />
        {/* Visible port */}
        <circle
          cx={props.node.width}
          cy={props.node.height / 2}
          r={8}
          fill={props.node.state ? '#4ade80' : '#6b7280'}
          stroke="#fff"
          stroke-width={2}
          class="port output-port"
          style={{ 'pointer-events': 'none' }}
        />
      </g>
    </g>
  );
};
