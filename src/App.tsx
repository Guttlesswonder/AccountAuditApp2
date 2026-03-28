import { useEffect, useMemo, useRef, useState } from 'react';
import { checklistItems, sectionLabels } from './data/checklist';
import { ActionRegister } from './components/ActionRegister';
import { FilterBar } from './components/FilterBar';
import { HeaderBar } from './components/HeaderBar';
import { MetricCard } from './components/MetricCard';
import { OpportunityRegister } from './components/OpportunityRegister';
import { ProductAdoptionTable } from './components/ProductAdoptionTable';
import { RiskRegister } from './components/RiskRegister';
import { SectionItemCard } from './components/SectionItemCard';
import { Sidebar } from './components/Sidebar';
import { SnapshotPanel } from './components/SnapshotPanel';
import { TermsAttachmentPanel } from './components/TermsAttachmentPanel';
import { IndexedDbTermsStore } from './lib/attachments/indexedDbTermsStore';
import { downloadAccountExcel } from './lib/exportExcel';
import { exportCurrentAccount, exportFullState, parseImportedAccount, parseImportedState } from './lib/exportJson';
import { deriveOpportunities } from './lib/opportunityRules';
import { deriveRiskRegister } from './lib/readiness';
import { calculateScores, labelForMetric } from './lib/scoring';
import { appStateStorage } from './lib/storage';
import { createEmptyAccount, createInitialState, deleteAccount, duplicateAccount, upsertAccount } from './lib/state';
import type { AccountRecord, ActionItem, AppState, SectionId } from './types';

const termsStore = new IndexedDbTermsStore();

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [state, setState] = useState<AppState>(() => appStateStorage.load() ?? createInitialState());
  const [tab, setTab] = useState('Summary');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'account' | 'full'>('account');
  const current = state.accounts.find((a) => a.id === state.currentAccountId) ?? state.accounts[0];

  useEffect(() => { appStateStorage.save(state); }, [state]);

  const scores = useMemo(() => calculateScores(current), [current]);
  const risks = useMemo(() => deriveRiskRegister(current), [current]);
  const opportunities = useMemo(() => deriveOpportunities(current), [current]);

  const saveAccount = (next: AccountRecord) => setState((prev) => upsertAccount(prev, { ...next, updatedAt: new Date().toISOString() }));

  const jumpToSection = (sectionId: SectionId) => {
    setTab('Audit');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const createActionFromPrompt = (promptId: string, type: ActionItem['type']) => {
    const item = checklistItems.find((c) => c.id === promptId);
    const response = current.responses[promptId];
    const action: ActionItem = {
      id: crypto.randomUUID(),
      title: item?.text.slice(0, 70) ?? 'Follow up',
      relatedSection: item?.sectionId ?? '',
      type,
      owner: response.owner ?? '',
      dueDate: response.dueDate ?? '',
      note: `From checklist:${promptId} ${response.followUpNote || response.consequence || response.answer}`,
    };
    saveAccount({ ...current, actions: [...current.actions, action] });
  };

  const controls = (
    <>
      <button className="btn-outline" onClick={() => downloadText(`${current.accountName}-account.json`, exportCurrentAccount(current))}>Export Account JSON</button>
      <button className="btn-outline" onClick={() => downloadText(`strategic-account-audit-state.json`, exportFullState(state))}>Export Full JSON</button>
      <button className="btn-outline" onClick={() => downloadAccountExcel(current)}>Export Excel</button>
      <select className="input" value={importMode} onChange={(e) => setImportMode(e.target.value as 'account' | 'full')}><option value="account">Import Account</option><option value="full">Import Full State</option></select>
      <button className="btn-outline" onClick={() => fileInputRef.current?.click()}>Import JSON</button>
      <input ref={fileInputRef} hidden type="file" accept="application/json" onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        const text = await file.text();
        if (importMode === 'full') {
          setState(parseImportedState(text));
        } else {
          const account = parseImportedAccount(text);
          setState((prev) => ({ accounts: [...prev.accounts, account], currentAccountId: account.id }));
        }
      }} />
    </>
  );

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        accounts={state.accounts}
        currentAccountId={current.id}
        onSwitch={(id) => setState((s) => ({ ...s, currentAccountId: id }))}
        onCreate={() => { const a = createEmptyAccount('New Account'); setState((s) => ({ accounts: [...s.accounts, a], currentAccountId: a.id })); }}
        onDuplicate={() => setState((s) => duplicateAccount(s, current.id))}
        onDelete={() => setState((s) => deleteAccount(s, current.id))}
        lens={current.reviewLens}
        onLensChange={(lens) => saveAccount({ ...current, reviewLens: lens })}
        onJump={jumpToSection}
      />
      <main className="flex-1 overflow-auto">
        <HeaderBar account={current} controls={controls} onSaveSnapshot={() => {
          saveAccount({ ...current, snapshots: [...current.snapshots, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...scores, note: '' }] });
        }} />
        <div className="p-6 space-y-4">
          <FilterBar tab={tab} setTab={setTab} />

          {tab === 'Summary' && <div className="space-y-4">
            <div className="grid md:grid-cols-4 gap-3">
              <MetricCard title="Relationship Health" value={labelForMetric('relationship', scores.relationshipHealth)} />
              <MetricCard title="Retention Risk" value={labelForMetric('retention', scores.retentionRisk)} />
              <MetricCard title="Growth Potential" value={labelForMetric('growth', scores.growthPotential)} />
              <MetricCard title="Operational Complexity" value={labelForMetric('complexity', scores.operationalComplexity)} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="card"><div className="label">Terms at a glance</div><p className="text-sm mt-2 whitespace-pre-wrap">{current.termsSummary || 'No terms summary yet.'}</p></div>
              <div className="card"><div className="label">Current footprint</div><p className="text-sm mt-2">{[current.hasDenticon && 'Denticon', current.hasCloud9 && 'Cloud 9', current.hasApteryx && 'Apteryx'].filter(Boolean).join(', ') || 'No active platform selected.'}</p></div>
              <div className="card"><div className="label">Top risks</div><ul className="text-sm mt-2 list-disc pl-5">{risks.slice(0,3).map((r) => <li key={r.id}>{r.prompt}</li>)}</ul></div>
              <div className="card"><div className="label">Top opportunities</div><ul className="text-sm mt-2 list-disc pl-5">{opportunities.slice(0,3).map((o) => <li key={o.id}>{o.title}</li>)}</ul></div>
            </div>
            <div className="card"><div className="label">Next 3 actions</div><ol className="mt-2 text-sm list-decimal pl-5">{current.actions.slice(0, 3).map((a) => <li key={a.id}>{a.title} ({a.owner || 'Unassigned'})</li>)}</ol></div>
          </div>}

          {tab === 'Audit' && <div className="space-y-3">{Object.entries(sectionLabels).map(([sectionId, label]) => (
            <details key={sectionId} id={sectionId} className="card" open={false}>
              <summary className="font-medium cursor-pointer">{label}</summary>
              <div className="space-y-3 mt-3">
                {sectionId === 'commercial_terms' && <>
                  <label className="label">Terms Summary</label>
                  <textarea className="input min-h-24" value={current.termsSummary} onChange={(e) => saveAccount({ ...current, termsSummary: e.target.value })} />
                  <TermsAttachmentPanel attachment={current.termsAttachment} onUpload={async (file) => {
                    const meta = await termsStore.put(current.id, file);
                    saveAccount({ ...current, termsAttachment: meta });
                  }} onOpen={async () => {
                    const stored = await termsStore.get(current.id);
                    if (!stored) return;
                    const url = URL.createObjectURL(stored.file);
                    window.open(url, '_blank');
                  }} onRemove={async () => {
                    await termsStore.remove(current.id);
                    saveAccount({ ...current, termsAttachment: null });
                  }} />
                </>}
                {checklistItems.filter((i) => i.sectionId === sectionId).map((item) => <SectionItemCard key={item.id} item={item} response={current.responses[item.id]} onChange={(response) => saveAccount({ ...current, responses: { ...current.responses, [item.id]: response } })} onCreateAction={() => createActionFromPrompt(item.id, item.kind === 'opportunity' ? 'opportunity' : item.kind === 'risk' ? 'risk' : 'follow_up')} />)}
              </div>
            </details>
          ))}</div>}

          {tab === 'Product Adoption' && <ProductAdoptionTable account={current} onUpdate={(id, row) => {
            if (id === '__platform_denticon') saveAccount({ ...current, hasDenticon: row.status === 'adopted' });
            else if (id === '__platform_cloud9') saveAccount({ ...current, hasCloud9: row.status === 'adopted' });
            else if (id === '__platform_apteryx') saveAccount({ ...current, hasApteryx: row.status === 'adopted' });
            else saveAccount({ ...current, productAdoption: { ...current.productAdoption, [id]: row } });
          }} />}

          {tab === 'Risk Register' && <RiskRegister risks={risks} />}
          {tab === 'Opportunity Register' && <OpportunityRegister opportunities={opportunities} />}
          {tab === 'Action Register' && <ActionRegister actions={current.actions} onChange={(actions) => saveAccount({ ...current, actions })} onAdd={() => saveAccount({ ...current, actions: [...current.actions, { id: crypto.randomUUID(), title: '', relatedSection: '', type: 'follow_up', owner: '', dueDate: '', note: '' }] })} onDelete={(id) => saveAccount({ ...current, actions: current.actions.filter((a) => a.id !== id) })} />}
          {tab === 'Snapshots' && <SnapshotPanel snapshots={current.snapshots} />}
        </div>
      </main>
    </div>
  );
}
