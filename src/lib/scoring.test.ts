import { describe, expect, it } from 'vitest';
import { createInitialState } from './state';
import { calculateScores } from './scoring';

describe('scoring', () => {
  it('calculates metric object', () => {
    const state = createInitialState();
    const score = calculateScores(state.accounts[0]);
    expect(score).toHaveProperty('overallPosture');
  });
});
