import { checklistItems } from '../data/checklist';
import { sectionLabels } from '../data/checklist';
import type { AccountRecord, RiskItem } from '../types';

export function deriveRiskRegister(account: AccountRecord): RiskItem[] {
  const checklistRisks = checklistItems
    .filter((item) => item.important || item.mode === 'flaggable')
    .map((item) => ({ item, response: account.responses[item.id] }))
    .filter(({ response }) => response?.status === 'At Risk' || response?.status === 'Unknown')
    .map(({ item, response }) => ({
      id: `${account.id}_${item.id}`,
      section: sectionLabels[item.sectionId],
      prompt: item.text,
      status: response.status as 'Unknown' | 'At Risk',
      answer: response.answer,
      consequence: response.consequence,
      nextStep: response.followUpNote,
      linkedAction: account.actions.find((a) => a.note.includes(item.id))?.title,
    }));

  const assessmentRisks = account.retentionAssessment.entries.map((entry) => ({
    id: `${account.id}_retention_${entry.id}`,
    section: sectionLabels.health_risk_growth,
    prompt: entry.title || 'Retention risk entry',
    status: account.retentionAssessment.overallScore.includes('Low') ? 'Unknown' as const : 'At Risk' as const,
    answer: `${entry.severity} | ${entry.likelihood} | ${entry.timing}`,
    consequence: entry.notes,
    nextStep: account.retentionAssessment.relatedNextStep,
    linkedAction: account.actions.find((a) => a.title.includes(entry.title))?.title,
  }));

  return [...checklistRisks, ...assessmentRisks];
}
