import type { LayoutPersistencePort } from '../../core/ports/LayoutPersistencePort.js';
import type { Circuit } from '../../types/circuit.js';

export const LAYOUT_STORAGE_VERSION = '1.0';
export const LAYOUT_STORAGE_KEY = 'logic-gates:layout';

interface StoredLayout {
  version: string;
  circuit: Circuit;
}

const getDefaultStorage = (): Storage | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
};

export class LocalStorageLayoutAdapter implements LayoutPersistencePort {
  private readonly storage: Storage | null;
  private memoryFallback: StoredLayout | null = null;

  constructor(storage: Storage | null = getDefaultStorage()) {
    this.storage = storage;
  }

  async saveLayout(circuit: Circuit): Promise<void> {
    const payload: StoredLayout = { version: LAYOUT_STORAGE_VERSION, circuit };
    const serialized = JSON.stringify(payload);

    if (!this.storage) {
      this.memoryFallback = payload;
      return;
    }

    try {
      this.storage.setItem(LAYOUT_STORAGE_KEY, serialized);
    } catch (error) {
      this.memoryFallback = payload;
      throw error;
    }
  }

  async loadLayout(): Promise<Circuit | null> {
    const payload = this.readFromStorage() ?? this.memoryFallback;
    if (!payload) return null;

    if (payload.version !== LAYOUT_STORAGE_VERSION) {
      return null;
    }

    return payload.circuit ?? null;
  }

  private readFromStorage(): StoredLayout | null {
    if (!this.storage) return null;

    try {
      const serialized = this.storage.getItem(LAYOUT_STORAGE_KEY);
      if (!serialized) return null;
      return JSON.parse(serialized) as StoredLayout;
    } catch (error) {
      return null;
    }
  }
}
