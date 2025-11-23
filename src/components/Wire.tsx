import type { Component } from 'solid-js';
import type { Wire as WireType, Position } from '../types/circuit';
import { circuitStore } from '../store/circuitStore';

interface WireProps {
  wire: WireType;
  onDelete: (wireId: string) => void;
}

export const Wire: Component<WireProps> = (props) => {
  const fromPort = () => circuitStore.findPort(props.wire.fromPortId);
  const toPort = () => circuitStore.findPort(props.wire.toPortId);

  const fromPos = () => {
    const port = fromPort();
    return port ? circuitStore.getPortPosition(port) : { x: 0, y: 0 };
  };

  const toPos = () => {
    const port = toPort();
    return port ? circuitStore.getPortPosition(port) : { x: 0, y: 0 };
  };

  const isActive = () => circuitStore.getWireState(props.wire);

  const pathD = () => {
    const from = fromPos();
    const to = toPos();
    const midX = (from.x + to.x) / 2;
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  };

  const handleClick = (e: MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      props.onDelete(props.wire.id);
    }
  };

  return (
    <g class="wire" onContextMenu={handleClick}>
      {/* Wire shadow for easier clicking */}
      <path
        d={pathD()}
        fill="none"
        stroke="transparent"
        stroke-width={12}
        style={{ cursor: 'pointer' }}
      />
      {/* Actual wire */}
      <path
        d={pathD()}
        fill="none"
        stroke={isActive() ? '#4ade80' : '#6b7280'}
        stroke-width={3}
        stroke-linecap="round"
        class={isActive() ? 'wire-active' : 'wire-inactive'}
      />
    </g>
  );
};

interface WirePreviewProps {
  from: Position;
  to: Position;
}

export const WirePreview: Component<WirePreviewProps> = (props) => {
  const pathD = () => {
    const midX = (props.from.x + props.to.x) / 2;
    return `M ${props.from.x} ${props.from.y} C ${midX} ${props.from.y}, ${midX} ${props.to.y}, ${props.to.x} ${props.to.y}`;
  };

  return (
    <path
      d={pathD()}
      fill="none"
      stroke="#9ca3af"
      stroke-width={2}
      stroke-dasharray="5,5"
      class="wire-preview"
    />
  );
};
