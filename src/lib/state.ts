import { checklistItems } from '../data/checklist';
import { productCatalog } from '../data/productCatalog';
import type { AccountRecord, AppState, Specialty } from '../types';
import { normalizeResponse } from './checklist';

const specialtyOptions: Specialty[] = ['Ortho', 'Pediatric', 'General Dental', 'OMS', 'Periodontist', 'Endodontist'];

export function createEmptyAccount(name = 'New Account'): AccountRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    accountName: name,
    crmRef: '',
    accountManager: '',
    segment: '',
    reviewLens: 'executive_review',
    decisionModelType: '',
    decisionModelNarrative: '',
    executiveSponsor: '',
    operationalChampion: '',
    stakeholders: [],
    specialtyCoverage: specialtyOptions.map((specialty) => ({ specialty, selected: false, totalLocations: '', usingPlanetDDS: '' })),
    hasDenticon: true,
    hasCloud9: false,
    hasApteryx: false,
    termsSummary: '',
    termsAttachment: null,
    createdAt: now,
    updatedAt: now,
    responses: Object.fromEntries(checklistItems.map((item) => [item.id, normalizeResponse(undefined)])),
    productAdoption: Object.fromEntries(productCatalog.map((product) => [product.id, { productId: product.id, status: 'unknown', notes: '', opportunityValue: '' }])),
    actions: [],
    snapshots: [],
  };
}

export function createInitialState(): AppState {
  const account = createEmptyAccount('Acme Dental Group');
  return { accounts: [account], currentAccountId: account.id };
}

export function duplicateAccount(state: AppState, accountId: string): AppState {
  const source = state.accounts.find((a) => a.id === accountId);
  if (!source) return state;
  const now = new Date().toISOString();
  const copy: AccountRecord = { ...source, id: crypto.randomUUID(), accountName: `${source.accountName} (Copy)`, createdAt: now, updatedAt: now, snapshots: [] };
  return { accounts: [...state.accounts, copy], currentAccountId: copy.id };
}

export function deleteAccount(state: AppState, accountId: string): AppState {
  const accounts = state.accounts.filter((a) => a.id !== accountId);
  const next = accounts[0] ?? createEmptyAccount();
  return { accounts: accounts.length ? accounts : [next], currentAccountId: accounts.length ? (state.currentAccountId === accountId ? accounts[0].id : state.currentAccountId) : next.id };
}

export function upsertAccount(state: AppState, account: AccountRecord): AppState {
  return { ...state, accounts: state.accounts.map((a) => (a.id === account.id ? account : a)) };
}
