import { For } from 'solid-js';
import type { Component } from 'solid-js';
import type { GateNode, Position, GateType } from '../types/circuit';

interface GateProps {
  node: GateNode;
  onStartDrag: (nodeId: string, offset: Position, isMultiSelect?: boolean) => void;
  onPortClick: (portId: string, nodeId: string, type: 'input' | 'output') => void;
  isSelected: boolean;
}

function getGateColor(gateType: GateType): string {
  switch (gateType) {
    case 'AND':
      return '#3b82f6';
    case 'OR':
      return '#8b5cf6';
    case 'NOT':
      return '#ef4444';
    case 'NAND':
      return '#06b6d4';
    case 'NOR':
      return '#ec4899';
    case 'XOR':
      return '#f59e0b';
    case 'XNOR':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

export const Gate: Component<GateProps> = (props) => {
  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);

    // Check for Ctrl (Windows/Linux) or Meta (Mac) key for multi-selection
    const isMultiSelect = e.ctrlKey || e.metaKey;

    // Pass client position - Canvas will calculate offset accounting for pan/zoom
    props.onStartDrag(props.node.id, {
      x: e.clientX,
      y: e.clientY,
    }, isMultiSelect);
  };

  const inputCount = () => props.node.inputPorts.length;
  const spacing = () => props.node.height / (inputCount() + 1);

  return (
    <g
      transform={`translate(${props.node.position.x}, ${props.node.position.y})`}
      class="circuit-node gate-node"
      onPointerDown={handlePointerDown}
    >
      {/* Gate body */}
      <rect
        x={0}
        y={0}
        width={props.node.width}
        height={props.node.height}
        rx={8}
        fill={getGateColor(props.node.gateType)}
        stroke={props.isSelected ? '#6ab0ff' : '#fff'}
        stroke-width={props.isSelected ? 3 : 2}
        class="node-body"
      />
      {/* Gate type label */}
      <text
        x={props.node.width / 2}
        y={props.node.height / 2 + 5}
        text-anchor="middle"
        fill="white"
        font-size="14"
        font-weight="bold"
        style={{ 'pointer-events': 'none' }}
      >
        {props.node.gateType}
      </text>
      {/* Input ports */}
      <For each={props.node.inputPorts}>
        {(port, index) => (
          <g class="port-group">
            {/* Invisible touch target */}
            <circle
              cx={0}
              cy={spacing() * (index() + 1)}
              r={18}
              fill="transparent"
              class="port-touch-target"
              style={{ cursor: 'crosshair' }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                props.onPortClick(port.id, props.node.id, 'input');
              }}
            />
            {/* Visible port */}
            <circle
              cx={0}
              cy={spacing() * (index() + 1)}
              r={8}
              fill="#6b7280"
              stroke="#fff"
              stroke-width={2}
              class="port input-port"
              style={{ 'pointer-events': 'none' }}
            />
          </g>
        )}
      </For>
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
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.onPortClick(props.node.outputPort.id, props.node.id, 'output');
          }}
        />
        {/* Visible port */}
        <circle
          cx={props.node.width}
          cy={props.node.height / 2}
          r={8}
          fill="#6b7280"
          stroke="#fff"
          stroke-width={2}
          class="port output-port"
          style={{ 'pointer-events': 'none' }}
        />
      </g>
      {/* NOT gate bubble */}
      {(props.node.gateType === 'NOT' ||
        props.node.gateType === 'NAND' ||
        props.node.gateType === 'NOR' ||
        props.node.gateType === 'XNOR') && (
        <circle
          cx={props.node.width + 2}
          cy={props.node.height / 2}
          r={4}
          fill="white"
          stroke={getGateColor(props.node.gateType)}
          stroke-width={2}
          style={{ 'pointer-events': 'none' }}
        />
      )}
    </g>
  );
};
