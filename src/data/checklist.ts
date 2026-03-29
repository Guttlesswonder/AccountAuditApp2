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

  { id: 'advanced_tools', sectionId: 'technology_data_vendors', text: 'Do they use 3D technology, AI tools, or other advanced partners? If yes, which ones?', gate: ['growth', 'executive_review'], category: 'technology', kind: 'opportunity', mode: 'simple' },

  { id: 'sentiment', sectionId: 'health_risk_growth', text: 'What is the current overall sentiment of the customer, leadership, operational, and technical?', gate: ['relationship', 'retention', 'executive_review'], category: 'risk', kind: 'health', mode: 'simple', important: true },
  { id: 'retention_risks', sectionId: 'health_risk_growth', text: 'What are the top retention risks or pressure points right now?', gate: ['retention', 'executive_review'], category: 'risk', kind: 'risk', mode: 'flaggable', important: true },
  { id: 'whitespace_opportunities', sectionId: 'health_risk_growth', text: 'What are the top whitespace opportunities based on current gaps, unsold add ons, location expansion, or adjacent needs?', gate: ['growth', 'executive_review'], category: 'commercial', kind: 'opportunity', mode: 'flaggable', important: true },
  { id: 'next_3_actions', sectionId: 'health_risk_growth', text: 'What are the top 3 next actions we should take internally or with the customer?', gate: ['relationship', 'retention', 'growth', 'executive_review'], category: 'risk', kind: 'coverage', mode: 'flaggable', important: true },
];
