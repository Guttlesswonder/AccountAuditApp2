import { describe, expect, it } from 'vitest';
import { createInitialState } from './state';
import { deriveRiskRegister } from './readiness';

describe('risk register', () => {
  it('derives from at-risk items', () => {
    const state = createInitialState();
    const account = state.accounts[0];
    account.responses.retention_risks.status = 'At Risk';
    account.responses.retention_risks.answer = 'Pricing pressure';
    const risks = deriveRiskRegister(account);
    expect(risks.length).toBeGreaterThan(0);
  });
});
