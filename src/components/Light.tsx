import type { Component } from 'solid-js';
import type { LightNode, Position } from '../types/circuit';

interface LightProps {
  node: LightNode;
  onStartDrag: (nodeId: string, offset: Position, isMultiSelect?: boolean) => void;
  onPortClick: (portId: string, nodeId: string, type: 'input' | 'output') => void;
  isSelected: boolean;
}

export const Light: Component<LightProps> = (props) => {
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

  return (
    <g
      transform={`translate(${props.node.position.x}, ${props.node.position.y})`}
      class="circuit-node light-node"
      onPointerDown={handlePointerDown}
    >
      {/* Input port */}
      <g class="port-group">
        {/* Invisible touch target */}
        <circle
          cx={0}
          cy={props.node.height / 2}
          r={18}
          fill="transparent"
          class="port-touch-target"
          style={{ cursor: 'crosshair' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.onPortClick(props.node.inputPort.id, props.node.id, 'input');
          }}
        />
        {/* Visible port */}
        <circle
          cx={0}
          cy={props.node.height / 2}
          r={8}
          fill="#6b7280"
          stroke="#fff"
          stroke-width={2}
          class="port input-port"
          style={{ 'pointer-events': 'none' }}
        />
      </g>
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
