import type { AccountRecord, AppState } from '../types';


const defaultSpecialtyCoverage = [
  'General Dental',
  'Ortho',
  'Pediatric',
  'OMS',
  'Periodontist',
  'Endodontist',
].map((specialty) => ({ specialty, selected: false, totalLocations: '', usingPlanetDDS: '' }));

export function exportCurrentAccount(account: AccountRecord): string {
  return JSON.stringify(account, null, 2);
}

export function exportFullState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function parseImportedAccount(raw: string): AccountRecord {
  const parsed = JSON.parse(raw) as Partial<AccountRecord>;
  return {
    id: parsed.id ?? crypto.randomUUID(),
    accountName: parsed.accountName ?? 'Imported Account',
    crmRef: parsed.crmRef ?? '',
    accountManager: parsed.accountManager ?? '',
    segment: parsed.segment ?? '',
    reviewLens: parsed.reviewLens ?? 'executive_review',
    decisionModelType: parsed.decisionModelType ?? '',
    decisionModelNarrative: parsed.decisionModelNarrative ?? '',
    executiveSponsor: parsed.executiveSponsor ?? '',
    operationalChampion: parsed.operationalChampion ?? '',
    stakeholders: parsed.stakeholders ?? [],
    specialtyCoverage: parsed.specialtyCoverage ?? defaultSpecialtyCoverage,
    growthPlanType: parsed.growthPlanType ?? '',
    fundingModelType: parsed.fundingModelType ?? '',
    standardizationCurrent: parsed.standardizationCurrent ?? '',
    standardizationVaries: parsed.standardizationVaries ?? '',
    standardizationTarget: parsed.standardizationTarget ?? '',
    locationsAdded12m: parsed.locationsAdded12m ?? '',
    locationsSold12m: parsed.locationsSold12m ?? '',
    growth12mContext: parsed.growth12mContext ?? '',
    operationsModel: parsed.operationsModel ?? '',
    operationsPainPoints: parsed.operationsPainPoints ?? [],
    operationsPainPointNote: parsed.operationsPainPointNote ?? '',
    hasDenticon: !!parsed.hasDenticon,
    hasCloud9: !!parsed.hasCloud9,
    hasApteryx: !!parsed.hasApteryx,
    termsSummary: parsed.termsSummary ?? '',
    termsAttachment: parsed.termsAttachment ?? null,
    createdAt: parsed.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    responses: parsed.responses ?? {},
    productAdoption: parsed.productAdoption ?? {},
    actions: parsed.actions ?? [],
    snapshots: parsed.snapshots ?? [],
  };
}

export function parseImportedState(raw: string): AppState {
  const parsed = JSON.parse(raw) as Partial<AppState>;
  const accounts = (parsed.accounts ?? []).map((account) => parseImportedAccount(JSON.stringify(account)));
  return {
    accounts,
    currentAccountId: parsed.currentAccountId ?? accounts[0]?.id ?? '',
  };
}
