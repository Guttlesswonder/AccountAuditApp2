import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageProvider } from './localStorageProvider';
import { createInitialState } from '../state';

describe('local storage provider', () => {
  const provider = new LocalStorageProvider();
  beforeEach(() => localStorage.clear());

  it('saves and loads state', () => {
    const state = createInitialState();
    provider.save(state);
    const loaded = provider.load();
    expect(loaded?.accounts[0].accountName).toBe(state.accounts[0].accountName);
  });
});
