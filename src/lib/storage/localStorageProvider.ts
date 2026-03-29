import type { AppState } from '../../types';
import type { AppStateStorageProvider } from './types';

const STORAGE_KEY = 'strategic-account-audit.v1.1';

export class LocalStorageProvider implements AppStateStorageProvider {
  load(): AppState | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AppState;
    } catch {
      return null;
    }
  }

  save(state: AppState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export { STORAGE_KEY };
