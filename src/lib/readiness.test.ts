import { describe, expect, it } from 'vitest';
import { createInitialState } from './state';
import { deriveRiskRegister } from './readiness';

describe('risk register', () => {
  it('derives from at-risk items', () => {
    const state = createInitialState();
    const account = state.accounts[0];
    account.retentionAssessment.overallScore = 'High Risk';
    account.retentionAssessment.entries = [{ id: 'r1', title: 'Pricing pressure', severity: 'high', likelihood: 'medium', timing: 'Q2', notes: 'active pressure' }];
    const risks = deriveRiskRegister(account);
    expect(risks.length).toBeGreaterThan(0);
  });
});
