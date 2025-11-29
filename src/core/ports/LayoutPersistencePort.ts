import type { Circuit } from '../../types/circuit.js';

export interface LayoutPersistencePort {
  saveLayout(circuit: Circuit): Promise<void>;
  loadLayout(): Promise<Circuit | null>;
}
