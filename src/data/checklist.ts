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
  { id: 'location_coverage', sectionId: 'commercial_terms', text: 'How many locations are currently using our software versus total customer locations?', gate: ['relationship', 'growth', 'executive_review'], category: 'commercial', kind: 'coverage', mode: 'simple', important: true },
  { id: 'specialty_mix', sectionId: 'commercial_terms', text: 'What specialties are represented across the account (General Dentistry, Ortho, OMS, Perio, Endo, or mixed)?', gate: ['relationship', 'growth', 'executive_review'], category: 'commercial', kind: 'coverage', mode: 'simple' },
  { id: 'commercial_blockers', sectionId: 'commercial_terms', text: 'Commercial blockers / contract limitations with vendor names and timing windows (for example: third-party contracts and end dates).', gate: ['retention', 'growth', 'executive_review'], category: 'risk', kind: 'risk', mode: 'flaggable', important: true },

  { id: 'growth_plan', sectionId: 'growth_practice', text: 'What are their growth plans, and do they grow via acquisition, de novo, or both?', gate: ['growth', 'executive_review'], category: 'commercial', kind: 'opportunity', mode: 'simple' },
  { id: 'funding_structure', sectionId: 'growth_practice', text: 'Are they PE backed, self funded, or another structure that affects growth decisions?', gate: ['growth', 'executive_review'], category: 'commercial', kind: 'health', mode: 'simple' },
  { id: 'last_12m_growth', sectionId: 'growth_practice', text: 'What growth have they seen in the last 12 months?', gate: ['growth', 'executive_review'], category: 'commercial', kind: 'health', mode: 'simple' },
  { id: 'standardization', sectionId: 'growth_practice', text: 'What is already standardized across locations, what still varies, and what do they want to standardize?', gate: ['growth', 'relationship'], category: 'process', kind: 'opportunity', mode: 'simple' },

  { id: 'operations_centralized', sectionId: 'operations_centralization', text: 'Are systems and workflows managed centrally or by location?', gate: ['relationship', 'retention', 'executive_review'], category: 'process', kind: 'health', mode: 'simple' },
  { id: 'decentralized_impact', sectionId: 'operations_centralization', text: 'If operations are not centralized, is that causing frustration, inconsistency, or impact to collections?', gate: ['retention', 'executive_review'], category: 'risk', kind: 'risk', mode: 'flaggable', important: true },
  { id: 'patient_communication', sectionId: 'operations_centralization', text: 'How do they currently manage patient communication?', gate: ['relationship', 'growth', 'executive_review'], category: 'process', kind: 'opportunity', mode: 'simple' },
  { id: 'insurance_processing', sectionId: 'operations_centralization', text: 'How are insurance payments processed, office level or centrally?', gate: ['relationship', 'retention'], category: 'process', kind: 'health', mode: 'simple' },

  { id: 'platform_standardization', sectionId: 'technology_data_vendors', text: 'Are they using multiple systems or standardized platforms?', gate: ['relationship', 'growth', 'executive_review'], category: 'technology', kind: 'health', mode: 'simple' },
  { id: 'advanced_tools', sectionId: 'technology_data_vendors', text: 'Do they use 3D technology, AI tools, or other advanced partners? If yes, which ones?', gate: ['growth', 'executive_review'], category: 'technology', kind: 'opportunity', mode: 'simple' },
  { id: 'bi_maturity', sectionId: 'technology_data_vendors', text: 'Do they have a data warehouse, and is BI handled in house or outsourced?', gate: ['growth', 'executive_review'], category: 'technology', kind: 'opportunity', mode: 'simple' },
  { id: 'vendor_landscape', sectionId: 'technology_data_vendors', text: 'What vendors are they using today, what services do those vendors provide, and where are the gaps or limitations?', gate: ['relationship', 'retention', 'growth'], category: 'technology', kind: 'risk', mode: 'simple' },

  { id: 'sentiment', sectionId: 'health_risk_growth', text: 'What is the current overall sentiment of the customer, leadership, operational, and technical?', gate: ['relationship', 'retention', 'executive_review'], category: 'risk', kind: 'health', mode: 'simple', important: true },
  { id: 'retention_risks', sectionId: 'health_risk_growth', text: 'What are the top retention risks or pressure points right now?', gate: ['retention', 'executive_review'], category: 'risk', kind: 'risk', mode: 'flaggable', important: true },
  { id: 'whitespace_opportunities', sectionId: 'health_risk_growth', text: 'What are the top whitespace opportunities based on current gaps, unsold add ons, location expansion, or adjacent needs?', gate: ['growth', 'executive_review'], category: 'commercial', kind: 'opportunity', mode: 'flaggable', important: true },
  { id: 'next_3_actions', sectionId: 'health_risk_growth', text: 'What are the top 3 next actions we should take internally or with the customer?', gate: ['relationship', 'retention', 'growth', 'executive_review'], category: 'risk', kind: 'coverage', mode: 'flaggable', important: true },
];
