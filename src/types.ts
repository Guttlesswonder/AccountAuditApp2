export type ReviewLens = 'relationship' | 'retention' | 'growth' | 'executive_review';

export type VisibleStatus = '' | 'Confirmed' | 'Unknown' | 'At Risk' | 'Opportunity' | 'Not Applicable';

export type Category = 'people' | 'process' | 'technology' | 'commercial' | 'risk';
export type ItemKind = 'coverage' | 'health' | 'risk' | 'opportunity';
export type ChecklistItemMode = 'simple' | 'flaggable';

export type SectionId =
  | 'commercial_terms'
  | 'people_ownership'
  | 'growth_practice'
  | 'operations_centralization'
  | 'technology_data_vendors'
  | 'health_risk_growth';

export type ChecklistItem = {
  id: string;
  sectionId: SectionId;
  text: string;
  gate: ReviewLens[];
  category: Category;
  kind: ItemKind;
  mode: ChecklistItemMode;
  important?: boolean;
};



export type Specialty = 'Ortho' | 'Pediatric' | 'General Dental' | 'OMS' | 'Periodontist' | 'Endodontist';

export type SpecialtyCoverage = {
  specialty: Specialty;
  selected: boolean;
  totalLocations: string;
  usingPlanetDDS: string;
};

export type StakeholderSentiment = 'promoter' | 'neutral' | 'detractor' | 'unknown';

export type StakeholderContact = {
  id: string;
  name: string;
  title: string;
  functionArea: string;
  sentiment: StakeholderSentiment;
  notes: string;
};

export type ResponseRecord = {
  status: VisibleStatus;
  answer: string;
  followUpNote?: string;
  owner?: string;
  dueDate?: string;
  consequence?: string;
};

export type ProductAdoptionStatus = 'adopted' | 'not_adopted' | 'partial' | 'unknown';

export type ProductAdoption = {
  productId: string;
  status: ProductAdoptionStatus;
  notes: string;
  opportunityValue?: '' | 'high' | 'medium' | 'low';
};

export type TermsAttachmentMeta = {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
};

export type ActionItem = {
  id: string;
  title: string;
  relatedSection: string;
  type: 'risk' | 'opportunity' | 'follow_up';
  owner: string;
  dueDate: string;
  note: string;
};

export type Snapshot = {
  id: string;
  createdAt: string;
  relationshipHealth: number;
  retentionRisk: number;
  growthPotential: number;
  operationalComplexity: number;
  overallPosture: 'Red' | 'Yellow' | 'Green' | 'Blue';
  note: string;
};

export type AccountRecord = {
  id: string;
  accountName: string;
  crmRef: string;
  accountManager: string;
  segment: string;
  reviewLens: ReviewLens;
  decisionModelType: string;
  decisionModelNarrative: string;
  executiveSponsor: string;
  operationalChampion: string;
  stakeholders: StakeholderContact[];
  specialtyCoverage: SpecialtyCoverage[];
  growthPlanType: '' | 'de_novo' | 'acquisition' | 'both';
  fundingModelType: '' | 'pe_backed' | 'self_funded' | 'other';
  standardizationCurrent: string;
  standardizationVaries: string;
  standardizationTarget: string;
  locationsAdded12m: string;
  locationsSold12m: string;
  growth12mContext: string;
  operationsModel: '' | 'centralized' | 'by_location' | 'mix';
  operationsPainPoints: string[];
  operationsPainPointNote: string;
  patientCommunicationModel: string;
  insuranceProcessingModel: string;
  hasDenticon: boolean;
  hasCloud9: boolean;
  hasApteryx: boolean;
  termsSummary: string;
  termsAttachment?: TermsAttachmentMeta | null;
  createdAt: string;
  updatedAt: string;
  responses: Record<string, ResponseRecord>;
  productAdoption: Record<string, ProductAdoption>;
  actions: ActionItem[];
  snapshots: Snapshot[];
};

export type AppState = {
  accounts: AccountRecord[];
  currentAccountId: string;
};

export type ProductDefinition = {
  id: string;
  platform: 'Denticon' | 'Cloud 9' | 'Apteryx';
  name: string;
};

export type OpportunityItem = {
  id: string;
  title: string;
  platform: string;
  category: string;
  whyItFits: string;
  confidence: 'high' | 'medium' | 'low';
  nextStep?: string;
  linkedEvidence: string;
};

export type RiskItem = {
  id: string;
  section: string;
  prompt: string;
  status: 'Unknown' | 'At Risk';
  answer: string;
  consequence?: string;
  nextStep?: string;
  linkedAction?: string;
};
