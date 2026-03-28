import type { AccountRecord, AppState } from '../types';

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
