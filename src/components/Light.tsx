import type { Component } from 'solid-js';
import type { LightNode, Position } from '../types/circuit';

interface LightProps {
  node: LightNode;
  onStartDrag: (nodeId: string, offset: Position) => void;
  onPortClick: (portId: string, nodeId: string, type: 'input' | 'output') => void;
  isSelected: boolean;
}

export const Light: Component<LightProps> = (props) => {
  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    props.onStartDrag(props.node.id, {
      x: e.clientX - props.node.position.x,
      y: e.clientY - props.node.position.y,
    });
  };

  return (
    <g
      transform={`translate(${props.node.position.x}, ${props.node.position.y})`}
      class="circuit-node light-node"
      onMouseDown={handleMouseDown}
    >
      {/* Input port */}
      <circle
        cx={0}
        cy={props.node.height / 2}
        r={6}
        fill="#6b7280"
        stroke="#fff"
        stroke-width={2}
        class="port input-port"
        style={{ cursor: 'crosshair' }}
        onClick={(e) => {
          e.stopPropagation();
          props.onPortClick(props.node.inputPort.id, props.node.id, 'input');
        }}
      />
      {/* Light bulb */}
      <circle
        cx={props.node.width / 2}
        cy={props.node.height / 2}
        r={props.node.width / 2 - 2}
        fill={props.node.state ? '#fbbf24' : '#374151'}
        stroke={props.isSelected ? '#6ab0ff' : '#666'}
        stroke-width={2}
        class="node-body"
      />
      {/* Glow effect when on */}
      {props.node.state && (
        <circle
          cx={props.node.width / 2}
          cy={props.node.height / 2}
          r={props.node.width / 2 + 5}
          fill="none"
          stroke="#fbbf24"
          stroke-width={3}
          opacity={0.4}
          class="light-glow"
        />
      )}
      {/* Light icon */}
      <text
        x={props.node.width / 2}
        y={props.node.height / 2 + 4}
        text-anchor="middle"
        fill={props.node.state ? '#1f2937' : '#9ca3af'}
        font-size="14"
        style={{ 'pointer-events': 'none' }}
      >
        💡
      </text>
    </g>
  );
};
