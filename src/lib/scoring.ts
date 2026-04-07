import { scoringConfig } from '../data/scoringConfig';
import type { AccountRecord } from '../types';

type ScoreSummary = {
  relationshipHealth: number;
  retentionRisk: number;
  growthPotential: number;
  operationalComplexity: number;
  overallPosture: 'Red' | 'Yellow' | 'Green' | 'Blue';
};

const sentimentMap: Record<string, number> = { 'Very Positive': 2, Positive: 1, Mixed: 0, Negative: -1, Critical: -2, '': 0 };
const retentionMap: Record<string, number> = { 'Low Risk': 0.25, 'Moderate Risk': 0.75, 'High Risk': 1.5, 'Critical Risk': 2, '': 0 };
const opportunityMap: Record<string, number> = { 'Strong Opportunity': 2, 'Qualified Opportunity': 1.25, 'Early Opportunity': 0.75, 'Limited Opportunity': 0.25, 'No Clear Opportunity': 0, '': 0 };

export function calculateScores(account: AccountRecord): ScoreSummary {
  const relationshipHealth = sentimentMap[account.sentimentAssessment.overallScore] ?? 0;
  const growthPotential = opportunityMap[account.opportunityAssessment.overallScore] ?? 0;
  const retentionRisk = retentionMap[account.retentionAssessment.overallScore] ?? 0;
  const operationalComplexity = (account.operationsModel === 'by_location' ? 1.5 : account.operationsModel === 'mix' ? 1 : 0.25) + (account.operationsPainPoints.length * 0.1);

  const avg = (relationshipHealth + growthPotential - retentionRisk - operationalComplexity) / 4;
  const overallPosture = avg <= scoringConfig.postureThresholds.red
    ? 'Red'
    : avg <= scoringConfig.postureThresholds.yellow
      ? 'Yellow'
      : avg >= scoringConfig.postureThresholds.green
        ? 'Blue'
        : 'Green';
  return { relationshipHealth, retentionRisk, growthPotential, operationalComplexity: Number(operationalComplexity.toFixed(2)), overallPosture };
}

export function labelForMetric(metric: 'relationship' | 'retention' | 'growth' | 'complexity', value: number) {
  if (metric === 'relationship') return value > 1.25 ? 'Strong' : value > 0.25 ? 'Moderate' : 'Low';
  return value > 1 ? 'High' : value > 0.25 ? 'Moderate' : 'Low';
}
