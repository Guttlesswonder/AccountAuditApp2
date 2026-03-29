import { describe, expect, it } from 'vitest';
import { parseImportedAccount, parseImportedState } from './exportJson';

describe('json import normalization', () => {
  it('normalizes account json', () => {
    const account = parseImportedAccount('{"accountName":"A"}');
    expect(account.accountName).toBe('A');
    expect(account.id).toBeTruthy();
  });

  it('normalizes full state', () => {
    const state = parseImportedState('{"accounts":[{"accountName":"A"}]}');
    expect(state.accounts).toHaveLength(1);
  });
});
