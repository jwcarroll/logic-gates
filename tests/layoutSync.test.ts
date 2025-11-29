import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LocalStorageLayoutAdapter, LAYOUT_STORAGE_KEY } from '../src/infrastructure/storage/LocalStorageLayoutAdapter.js';
import { LayoutSyncService } from '../src/application/LayoutSyncService.js';
import type { Circuit } from '../src/types/circuit.js';
import type { LayoutPersistencePort } from '../src/core/ports/LayoutPersistencePort.js';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('LocalStorageLayoutAdapter', () => {
  const sampleCircuit: Circuit = {
    nodes: [
      {
        id: 'n1',
        type: 'switch',
        position: { x: 0, y: 0 },
        width: 10,
        height: 10,
        state: true,
        outputPort: { id: 'p1', nodeId: 'n1', type: 'output', index: 0, position: { x: 0, y: 0 } },
      },
    ],
    wires: [],
  };

  it('saves and loads a circuit', async () => {
    const storage = new MemoryStorage();
    const adapter = new LocalStorageLayoutAdapter(storage);

    await adapter.saveLayout(sampleCircuit);
    const loaded = await adapter.loadLayout();

    assert.deepEqual(loaded, sampleCircuit);
    assert.ok(storage.getItem(LAYOUT_STORAGE_KEY));
  });

  it('returns null when version mismatches', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ version: '0.9', circuit: sampleCircuit })
    );
    const adapter = new LocalStorageLayoutAdapter(storage);

    const loaded = await adapter.loadLayout();
    assert.equal(loaded, null);
  });

  it('falls back to memory when storage is unavailable', async () => {
    const adapter = new LocalStorageLayoutAdapter(null);

    await adapter.saveLayout(sampleCircuit);
    const loaded = await adapter.loadLayout();

    assert.deepEqual(loaded, sampleCircuit);
  });
});

describe('LayoutSyncService', () => {
  it('delegates save calls to the persistence port', async () => {
    const saved: Circuit[] = [];
    const port: LayoutPersistencePort = {
      saveLayout: async (circuit) => {
        saved.push(circuit);
      },
      loadLayout: async () => null,
    };
    const service = new LayoutSyncService(port);
    const circuit: Circuit = { nodes: [], wires: [] };

    await service.syncOnChange(circuit);

    assert.equal(saved.length, 1);
    assert.deepEqual(saved[0], circuit);
    assert.notStrictEqual(saved[0], circuit);
  });

  it('notifies the error handler when save fails', async () => {
    let handled = false;
    const port: LayoutPersistencePort = {
      saveLayout: async () => {
        throw new Error('save failed');
      },
      loadLayout: async () => null,
    };
    const service = new LayoutSyncService(port, () => {
      handled = true;
    });

    await service.syncOnChange({ nodes: [], wires: [] });

    assert.equal(handled, true);
  });

  it('returns null on load failure', async () => {
    const port: LayoutPersistencePort = {
      saveLayout: async () => {},
      loadLayout: async () => {
        throw new Error('load failed');
      },
    };
    const service = new LayoutSyncService(port, () => {});

    const restored = await service.restore();

    assert.equal(restored, null);
  });
});
