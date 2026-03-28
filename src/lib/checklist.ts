import { checklistItems } from '../data/checklist';
import type { ResponseRecord } from '../types';

export function initialResponses(): Record<string, ResponseRecord> {
  return checklistItems.reduce<Record<string, ResponseRecord>>((acc, item) => {
    acc[item.id] = { status: '', answer: '' };
    return acc;
  }, {});
}

export function normalizeResponse(input: Partial<ResponseRecord> | undefined): ResponseRecord {
  return {
    status: input?.status ?? '',
    answer: input?.answer ?? '',
    followUpNote: input?.followUpNote ?? '',
    owner: input?.owner ?? '',
    dueDate: input?.dueDate ?? '',
    consequence: input?.consequence ?? '',
  };
}
