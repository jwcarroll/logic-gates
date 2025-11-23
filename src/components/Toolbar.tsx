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
  const gateTypes: GateType[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'];

  return (
    <div class="toolbar">
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
          <li>Click buttons above to add components</li>
          <li>Drag components to move them</li>
          <li>Click ports (circles) to connect wires</li>
          <li>Click switch to toggle ON/OFF</li>
          <li>Right-click wire to delete</li>
          <li>Click component + Delete key to remove</li>
        </ul>
      </div>
    </div>
  );
};
