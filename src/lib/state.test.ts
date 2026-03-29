import { describe, expect, it } from 'vitest';
import { initialResponses, normalizeResponse } from './checklist';
import { createInitialState, deleteAccount, duplicateAccount } from './state';

describe('checklist response helpers', () => {
  it('generates initial responses', () => {
    const responses = initialResponses();
    expect(Object.keys(responses).length).toBeGreaterThan(0);
  });

  it('normalizes sparse response', () => {
    expect(normalizeResponse({ status: 'Unknown' }).answer).toBe('');
  });
});

describe('account state', () => {
  it('create/duplicate/delete account', () => {
    const initial = createInitialState();
    const duplicated = duplicateAccount(initial, initial.currentAccountId);
    expect(duplicated.accounts).toHaveLength(2);
    const deleted = deleteAccount(duplicated, duplicated.currentAccountId);
    expect(deleted.accounts).toHaveLength(1);
  });
});
