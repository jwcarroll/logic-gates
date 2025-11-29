import type { Component } from 'solid-js';
import { circuitStore } from './store/circuitStore';
import { Canvas } from './components/Canvas';
import './App.css';

const App: Component = () => {
  const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
  let importInputRef: HTMLInputElement | undefined;

  const handleExport = () => {
    try {
      const jsonData = circuitStore.exportCircuit();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logic-circuit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export circuit: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = circuitStore.importCircuit(content);
        if (!result.success) {
          alert('Failed to import circuit: ' + result.error);
        }
      } catch (error) {
        alert('Failed to read file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    importInputRef?.click();
  };

  const handleFileChange = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    const [file] = target.files ?? [];
    if (file) {
      handleImport(file);
      target.value = '';
    }
  };

  return (
    <div class="app-shell">
      <div class="app-backdrop" aria-hidden="true" />
      <header class="control-bar glass-surface">
        <div class="brand">
          <div class="brand-title">Logic Gate Studio</div>
          <span class="version-pill">v{appVersion}</span>
        </div>
        <div class="control-actions">
          <button class="ghost-button" type="button" onClick={handleExport}>
            Export Circuit
          </button>
          <button class="primary-button" type="button" onClick={handleImportClick}>
            Import Circuit
          </button>
          <input
            ref={importInputRef}
            class="file-input"
            type="file"
            accept="application/json"
            onChange={handleFileChange}
          />
        </div>
      </header>

      <div class="workspace">
        <aside class="tool-rail glass-surface">
          <div class="rail-section">
            <p class="rail-label">Primary Tools</p>
            <ul>
              <li>Place gates</li>
              <li>Wire signals</li>
              <li>Group modules</li>
              <li>Test outputs</li>
            </ul>
          </div>
          <div class="rail-footer">Navigate, build, iterate.</div>
        </aside>

        <main class="canvas-stage">
          <div class="canvas-card glass-surface">
            <Canvas />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
