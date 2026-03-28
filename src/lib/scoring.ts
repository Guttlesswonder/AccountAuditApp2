import { checklistItems } from '../data/checklist';
import { scoringConfig } from '../data/scoringConfig';
import type { AccountRecord } from '../types';

type ScoreSummary = {
  relationshipHealth: number;
  retentionRisk: number;
  growthPotential: number;
  operationalComplexity: number;
  overallPosture: 'Red' | 'Yellow' | 'Green' | 'Blue';
};

function scoreFromStatuses(values: string[]) {
  if (!values.length) return 0;
  const total = values.reduce((sum, status) => sum + (scoringConfig.statusWeights as Record<string, number>)[status] ?? 0, 0);
  return Number((total / values.length).toFixed(2));
}

export function calculateScores(account: AccountRecord): ScoreSummary {
  const byLens = (lens: string) => checklistItems.filter((item) => item.gate.includes(lens as never)).map((item) => account.responses[item.id]?.status ?? '');
  const relationshipHealth = scoreFromStatuses(byLens('relationship'));
  const growthPotential = scoreFromStatuses(byLens('growth'));
  const retentionRisk = Math.abs(scoreFromStatuses(byLens('retention')) * -1);
  const opsStatuses = ['operations_centralization', 'technology_data_vendors']
    .flatMap((sectionId) => checklistItems.filter((i) => i.sectionId === sectionId))
    .map((item) => account.responses[item.id]?.status ?? '');
  const operationalComplexity = Math.abs(scoreFromStatuses(opsStatuses) * -1);
  const avg = (relationshipHealth + growthPotential - retentionRisk - operationalComplexity) / 4;
  const overallPosture = avg <= scoringConfig.postureThresholds.red
    ? 'Red'
    : avg <= scoringConfig.postureThresholds.yellow
      ? 'Yellow'
      : avg >= scoringConfig.postureThresholds.green
        ? 'Blue'
        : 'Green';
  return { relationshipHealth, retentionRisk, growthPotential, operationalComplexity, overallPosture };
}

export function labelForMetric(metric: 'relationship' | 'retention' | 'growth' | 'complexity', value: number) {
  if (metric === 'relationship') return value > 0.75 ? 'Strong' : value > -0.25 ? 'Moderate' : 'Low';
  return value > 1 ? 'High' : value > 0.25 ? 'Moderate' : 'Low';
}
