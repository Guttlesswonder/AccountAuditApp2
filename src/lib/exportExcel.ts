import * as XLSX from 'xlsx';
import { checklistItems, sectionLabels } from '../data/checklist';
import { deriveRiskRegister } from './readiness';
import { deriveOpportunities } from './opportunityRules';
import { calculateScores, labelForMetric } from './scoring';
import type { AccountRecord } from '../types';

function rowsForSection(account: AccountRecord, sectionId: keyof typeof sectionLabels) {
  return checklistItems
    .filter((i) => i.sectionId === sectionId)
    .map((item) => ({ Prompt: item.text, Status: account.responses[item.id]?.status ?? '', Answer: account.responses[item.id]?.answer ?? '' }));
}

export function workbookForAccount(account: AccountRecord) {
  const wb = XLSX.utils.book_new();
  const scores = calculateScores(account);
  const summary = [{
    Account: account.accountName,
    CRM: account.crmRef,
    Manager: account.accountManager,
    ExecutiveSponsor: account.executiveSponsor,
    OperationalChampion: account.operationalChampion,
    DecisionModel: account.decisionModelType,
    GrowthPlan: account.growthPlanType,
    FundingModel: account.fundingModelType,
    LocationsAdded12m: account.locationsAdded12m,
    LocationsSold12m: account.locationsSold12m,
    OperationsModel: account.operationsModel,
    OperationsPainPoints: (account.operationsPainPoints ?? []).join(', '),
    PatientCommunicationModel: account.patientCommunicationModel,
    InsuranceProcessingModel: account.insuranceProcessingModel,
    ThirdPartyVendors: account.thirdPartyVendorsSummary,
    TechnologyGaps: account.technologyGapSummary,
    VendorPainPoints: account.vendorPainPointSummary,
    SolveByProductOrRoadmap: account.solveByProductOrRoadmap,
    HasDataWarehouse: account.hasDataWarehouse ? 'Yes' : 'No',
    DataWarehouseTools: account.dataWarehouseTools,
    SentimentScore: account.sentimentAssessment.overallScore,
    RetentionRiskScore: account.retentionAssessment.overallScore,
    OpportunityScore: account.opportunityAssessment.overallScore,
    NextActionPriority: account.nextActionAssessment.overallScore,
    SpecialtyCoverage: account.specialtyCoverage.filter((s) => s.selected).map((s) => `${s.specialty}: ${s.usingPlanetDDS}/${s.totalLocations}`).join('; '),
    RelationshipHealth: labelForMetric('relationship', scores.relationshipHealth),
    RetentionRisk: labelForMetric('retention', scores.retentionRisk),
    GrowthPotential: labelForMetric('growth', scores.growthPotential),
    OperationalComplexity: labelForMetric('complexity', scores.operationalComplexity),
    OverallPosture: scores.overallPosture,
    TermsAttachmentFile: account.termsAttachment?.fileName ?? '',
    TermsUploadedAt: account.termsAttachment?.uploadedAt ?? '',
    TermsAvailableLocally: account.termsAttachment ? 'Yes' : 'No',
  }];

  const tabs: Array<[string, unknown[]]> = [
    ['Summary', summary],
    ['Commercial & Terms', rowsForSection(account, 'commercial_terms')],
    ['People & Ownership', rowsForSection(account, 'people_ownership')],
    ['Growth & Practice Model', rowsForSection(account, 'growth_practice')],
    ['Operations & Centralization', rowsForSection(account, 'operations_centralization')],
    ['Technology, Data & Vendors', rowsForSection(account, 'technology_data_vendors')],
    ['Health, Risk & Opportunities', rowsForSection(account, 'health_risk_growth')],
    ['Product Adoption', Object.values(account.productAdoption)],
    ['Action Register', account.actions],
    ['Snapshots', account.snapshots],
    ['Risk Register', deriveRiskRegister(account)],
    ['Opportunity Register', deriveOpportunities(account)],
    ['Health Assessment', [
      { Block: 'Sentiment', Score: account.sentimentAssessment.overallScore, Confidence: account.sentimentAssessment.confidence, Rationale: account.sentimentAssessment.rationale, Evidence: account.sentimentAssessment.evidence, EvidenceDate: account.sentimentAssessment.evidenceDate },
      { Block: 'Retention', Score: account.retentionAssessment.overallScore, Confidence: account.retentionAssessment.confidence, Rationale: account.retentionAssessment.rationale, Evidence: account.retentionAssessment.evidence, EvidenceDate: account.retentionAssessment.evidenceDate },
      { Block: 'Whitespace', Score: account.opportunityAssessment.overallScore, Confidence: account.opportunityAssessment.confidence, Rationale: account.opportunityAssessment.rationale, Evidence: account.opportunityAssessment.evidence, EvidenceDate: account.opportunityAssessment.evidenceDate },
      { Block: 'Next Actions', Score: account.nextActionAssessment.overallScore, Confidence: account.nextActionAssessment.confidence, Rationale: account.nextActionAssessment.rationale, Evidence: account.nextActionAssessment.evidence, EvidenceDate: account.nextActionAssessment.evidenceDate },
    ]],
  ];

  tabs.forEach(([name, rows]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name));
  return wb;
}

export function downloadAccountExcel(account: AccountRecord) {
  const wb = workbookForAccount(account);
  XLSX.writeFile(wb, `${account.accountName || 'account'}-audit.xlsx`);
}
