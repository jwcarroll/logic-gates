import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import type { GateType } from '../types/circuit';

interface ToolbarProps {
  onAddSwitch: () => void;
  onAddLight: () => void;
  onAddGate: (gateType: GateType) => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  hasSelection: boolean;
}

export const Toolbar: Component<ToolbarProps> = (props) => {
  const [isCollapsed, setIsCollapsed] = createSignal(false);
  const gateTypes: GateType[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'];
  let fileInputRef: HTMLInputElement | undefined;

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed());
  };

  const handleImportClick = () => {
    fileInputRef?.click();
  };

  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      props.onImport(file);
      // Reset input so same file can be imported again
      target.value = '';
    }
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

      <div class="toolbar-section">
        <h3>File</h3>
        <button class="toolbar-btn export-btn" onClick={props.onExport}>
          <span class="btn-icon">💾</span>
          Export
        </button>
        <button class="toolbar-btn import-btn" onClick={handleImportClick}>
          <span class="btn-icon">📂</span>
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.logic"
          style="display: none"
          onChange={handleFileChange}
        />
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
