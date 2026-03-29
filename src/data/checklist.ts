import type { ChecklistItem, SectionId } from '../types';

export const sectionLabels: Record<SectionId, string> = {
  commercial_terms: 'Commercial Footprint & Terms',
  people_ownership: 'People & Ownership',
  growth_practice: 'Growth Strategy & Practice Model',
  operations_centralization: 'Operations & Centralization',
  technology_data_vendors: 'Technology, Data, & Vendors',
  health_risk_growth: 'Health, Risk, & Growth Opportunities',
};

export const checklistItems: ChecklistItem[] = [
  { id: 'commercial_blockers', sectionId: 'commercial_terms', text: 'Commercial blockers / contract limitations with vendor names and timing windows (for example: third-party contracts and end dates).', gate: ['retention', 'growth', 'executive_review'], category: 'risk', kind: 'risk', mode: 'flaggable', important: true },


];
