import { checklistItems } from '../data/checklist';
import { sectionLabels } from '../data/checklist';
import type { AccountRecord, RiskItem } from '../types';

export function deriveRiskRegister(account: AccountRecord): RiskItem[] {
  return checklistItems
    .filter((item) => item.important || item.mode === 'flaggable')
    .map((item) => {
      const response = account.responses[item.id];
      return { item, response };
    })
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
}
