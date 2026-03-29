import { describe, expect, it } from 'vitest';
import { deriveOpportunities, reorderProductsByPlatform } from './opportunityRules';
import { createInitialState } from './state';

describe('opportunity rules', () => {
  it('derives opportunities from responses', () => {
    const state = createInitialState();
    const account = state.accounts[0];
    account.patientCommunicationModel = 'Patient communication is fragmented';
    const items = deriveOpportunities(account);
    expect(items.length).toBeGreaterThan(0);
  });

  it('reorders products by active platform', () => {
    const ordered = reorderProductsByPlatform(['Cloud 9']);
    expect(ordered[0].platform).toBe('Cloud 9');
  });
});
