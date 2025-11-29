import type { LayoutPersistencePort } from '../core/ports/LayoutPersistencePort.js';
import type { Circuit } from '../types/circuit.js';
import { LocalStorageLayoutAdapter } from '../infrastructure/storage/LocalStorageLayoutAdapter.js';

export type LayoutSyncErrorType = 'save' | 'load';

export interface LayoutSyncError {
  type: LayoutSyncErrorType;
  message: string;
  cause?: unknown;
}

export type LayoutSyncErrorHandler = (error: LayoutSyncError) => void;

export class LayoutSyncService {
  private readonly persistence: LayoutPersistencePort;
  private readonly onError?: LayoutSyncErrorHandler;
  private saveErrorNotified = false;

  constructor(persistence: LayoutPersistencePort, onError?: LayoutSyncErrorHandler) {
    this.persistence = persistence;
    this.onError = onError;
  }

  static createWithLocalAdapter(onError?: LayoutSyncErrorHandler): LayoutSyncService {
    return new LayoutSyncService(new LocalStorageLayoutAdapter(), onError);
  }

  async syncOnChange(circuit: Circuit): Promise<void> {
    try {
      await this.persistence.saveLayout(this.cloneCircuit(circuit));
      this.saveErrorNotified = false;
    } catch (error) {
      this.handleError({
        type: 'save',
        message: 'Failed to save circuit layout.',
        cause: error,
      }, true);
    }
  }

  async restore(): Promise<Circuit | null> {
    try {
      return await this.persistence.loadLayout();
    } catch (error) {
      this.handleError({
        type: 'load',
        message: 'Failed to load saved circuit layout.',
        cause: error,
      });
      return null;
    }
  }

  private cloneCircuit(circuit: Circuit): Circuit {
    return JSON.parse(JSON.stringify(circuit)) as Circuit;
  }

  private handleError(error: LayoutSyncError, suppressRepeatSaveAlerts = false) {
    if (this.onError) {
      this.onError(error);
      return;
    }

    if (error.type === 'save' && suppressRepeatSaveAlerts && this.saveErrorNotified) {
      return;
    }

    console.error(error.message, error.cause);
    if (typeof alert === 'function') {
      alert(error.message);
    }

    if (error.type === 'save' && suppressRepeatSaveAlerts) {
      this.saveErrorNotified = true;
    }
  }
}
