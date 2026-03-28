import type { AppState } from '../../types';

export interface AppStateStorageProvider {
  load(): AppState | null;
  save(state: AppState): void;
  clear(): void;
}
