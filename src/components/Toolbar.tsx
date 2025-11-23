import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import type { GateType } from '../types/circuit';

interface ToolbarProps {
  onAddSwitch: () => void;
  onAddLight: () => void;
  onAddGate: (gateType: GateType) => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
}

export const Toolbar: Component<ToolbarProps> = (props) => {
  const [isCollapsed, setIsCollapsed] = createSignal(false);
  const gateTypes: GateType[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed());
  };

  return (
    <div class={`toolbar ${isCollapsed() ? 'collapsed' : ''}`}>
      <div class="toolbar-section toolbar-toggle-section">
        <button class="toolbar-toggle" onClick={toggleCollapse}>
          <span>{isCollapsed() ? '▼' : '▲'}</span>
          {isCollapsed() ? 'Show Tools' : 'Hide Tools'}
        </button>
      </div>

      <div class="toolbar-section">
        <h3>Inputs</h3>
        <button class="toolbar-btn switch-btn" onClick={props.onAddSwitch}>
          <span class="btn-icon">🔘</span>
          Switch
        </button>
      </div>

      <div class="toolbar-section">
        <h3>Gates</h3>
        <div class="gate-buttons">
          {gateTypes.map((gateType) => (
            <button
              class={`toolbar-btn gate-btn gate-${gateType.toLowerCase()}`}
              onClick={() => props.onAddGate(gateType)}
            >
              {gateType}
            </button>
          ))}
        </div>
      </div>

      <div class="toolbar-section">
        <h3>Outputs</h3>
        <button class="toolbar-btn light-btn" onClick={props.onAddLight}>
          <span class="btn-icon">💡</span>
          Light
        </button>
      </div>

      <div class="toolbar-section toolbar-actions">
        <button
          class="toolbar-btn delete-btn"
          onClick={props.onDeleteSelected}
          disabled={!props.hasSelection}
        >
          Delete Selected
        </button>
        <button class="toolbar-btn clear-btn" onClick={props.onClear}>
          Clear All
        </button>
      </div>

      <div class="toolbar-section toolbar-help">
        <h3>Help</h3>
        <ul>
          <li>Tap buttons above to add components</li>
          <li>Drag components to move them</li>
          <li>Tap ports (circles) to connect wires</li>
          <li>Tap switch to toggle ON/OFF</li>
          <li>Select component + Delete to remove</li>
        </ul>
      </div>
    </div>
  );
};
