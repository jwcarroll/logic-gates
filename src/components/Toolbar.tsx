import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import type { GateType } from '../types/circuit';

interface ToolbarProps {
  onAddSwitch: () => void;
  onAddLight: () => void;
  onAddGate: (gateType: GateType) => void;
  onAddGroup: () => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  onCreateGroup: () => void;
  onUngroup: () => void;
  onCloneGroup: () => void;
  onToggleCollapse: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  hasSelection: boolean;
  selectedCount: number;
  activeTool: 'select' | 'pan';
  onToolChange: (tool: 'select' | 'pan') => void;
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
        <h3>Tools</h3>
        <div class="tool-buttons">
          <button
            class={`toolbar-btn tool-btn ${props.activeTool === 'select' ? 'active' : ''}`}
            onClick={() => props.onToolChange('select')}
          >
            <span class="btn-icon">🖱️</span>
            Select
          </button>
          <button
            class={`toolbar-btn tool-btn ${props.activeTool === 'pan' ? 'active' : ''}`}
            onClick={() => props.onToolChange('pan')}
          >
            <span class="btn-icon">✋</span>
            Hand
          </button>
        </div>
        <div class="tool-hint">Hold Space or right-click drag to pan</div>
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
        <h3>Groups</h3>
        <button class="toolbar-btn add-group-btn" onClick={props.onAddGroup}>
          <span class="btn-icon">📦</span>
          Add Group
        </button>
        <button
          class={`toolbar-btn group-btn ${props.selectedCount >= 2 ? 'highlighted' : ''}`}
          onClick={props.onCreateGroup}
          title={props.selectedCount < 2 ? 'Select 2+ components first (Ctrl/Cmd+Click)' : `Group ${props.selectedCount} selected components`}
        >
          <span class="btn-icon">🗂️</span>
          Group Selected {props.selectedCount >= 2 ? `(${props.selectedCount})` : ''}
        </button>
        <button class="toolbar-btn ungroup-btn" onClick={props.onUngroup}>
          <span class="btn-icon">📤</span>
          Ungroup
        </button>
        <button class="toolbar-btn clone-btn" onClick={props.onCloneGroup}>
          <span class="btn-icon">📋</span>
          Clone
        </button>
        <button class="toolbar-btn collapse-btn" onClick={props.onToggleCollapse}>
          <span class="btn-icon">🔽</span>
          Collapse/Expand
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
        {props.selectedCount > 0 && (
          <div class="selection-indicator">
            ✓ {props.selectedCount} component{props.selectedCount !== 1 ? 's' : ''} selected
          </div>
        )}
        <ul>
          <li>Tap buttons above to add components</li>
          <li>Drag components to move them</li>
          <li>Tap ports (circles) to connect wires</li>
          <li>Tap switch to toggle ON/OFF</li>
          <li><strong>Drag on canvas to select multiple</strong></li>
          <li>Ctrl/Cmd+Click for additional selection</li>
          <li>Hold Space or use Hand tool/right-drag to pan</li>
          <li>Select 2+ and click Group to combine</li>
          <li>Double-click group to collapse/expand</li>
          <li>Delete key to remove selected</li>
        </ul>
      </div>
    </div>
  );
};
