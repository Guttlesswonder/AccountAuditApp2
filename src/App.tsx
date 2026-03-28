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
import { createEmptyAccount, createInitialState, deleteAccount, duplicateAccount, normalizeAppState, upsertAccount } from './lib/state';
import type { AccountRecord, ActionItem, AppState, SectionId, StakeholderContact } from './types';

const termsStore = new IndexedDbTermsStore();
const decisionModels = [
  'Top-down centralized management-driven adoption',
  'Practice-by-practice local adoption',
  'Operations-driven consolidation across legacy software and preferred vendors',
  'Other',
];

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
  const [state, setState] = useState<AppState>(() => normalizeAppState(appStateStorage.load() ?? createInitialState()));
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
              <div className="card"><div className="label">Top risks</div><ul className="text-sm mt-2 list-disc pl-5">{risks.slice(0, 3).map((r) => <li key={r.id}>{r.prompt}</li>)}</ul></div>
              <div className="card"><div className="label">Top opportunities</div><ul className="text-sm mt-2 list-disc pl-5">{opportunities.slice(0, 3).map((o) => <li key={o.id}>{o.title}</li>)}</ul></div>
            </div>
            <div className="card"><div className="label">Next 3 actions</div><ol className="mt-2 text-sm list-decimal pl-5">{current.actions.slice(0, 3).map((a) => <li key={a.id}>{a.title} ({a.owner || 'Unassigned'})</li>)}</ol></div>
          </div>}

          {tab === 'Audit' && <div className="space-y-3">{Object.entries(sectionLabels).map(([sectionId, label]) => (
            <details key={sectionId} id={sectionId} className="card" open={false}>
              <summary className="font-medium cursor-pointer">{label}</summary>
              <div className="space-y-3 mt-3">
                {sectionId === 'commercial_terms' && <>
                  <label className="label">Terms Summary</label>
                  <p className="text-xs text-slate-600">Document renewal timing, pricing structure, and notable commercial constraints here.</p>
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



                {sectionId === 'commercial_terms' && <div className="border rounded p-3 bg-slate-50 space-y-2">
                  <div className="label">Specialty footprint</div>
                  <p className="text-xs text-slate-600">Select each specialty in the account, then capture total locations and locations currently using Planet DDS services.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr><th className="text-left">Include</th><th className="text-left">Specialty</th><th className="text-left">Total locations</th><th className="text-left">Using Planet DDS</th></tr></thead>
                      <tbody>
                        {(current.specialtyCoverage ?? []).map((row, idx) => <tr key={row.specialty} className="border-t">
                          <td><input type="checkbox" checked={row.selected} onChange={(e) => {
                            const specialtyCoverage = [...current.specialtyCoverage];
                            specialtyCoverage[idx] = { ...row, selected: e.target.checked };
                            saveAccount({ ...current, specialtyCoverage });
                          }} /></td>
                          <td>{row.specialty}</td>
                          <td><input className="input" value={row.totalLocations} onChange={(e) => {
                            const specialtyCoverage = [...current.specialtyCoverage];
                            specialtyCoverage[idx] = { ...row, totalLocations: e.target.value };
                            saveAccount({ ...current, specialtyCoverage });
                          }} /></td>
                          <td><input className="input" value={row.usingPlanetDDS} onChange={(e) => {
                            const specialtyCoverage = [...current.specialtyCoverage];
                            specialtyCoverage[idx] = { ...row, usingPlanetDDS: e.target.value };
                            saveAccount({ ...current, specialtyCoverage });
                          }} /></td>
                        </tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>}



                {sectionId === 'growth_practice' && <div className="space-y-3 border rounded p-3 bg-slate-50">
                  <div className="grid md:grid-cols-2 gap-2">
                    <label className="text-sm">Growth Plan
                      <select className="input" value={current.growthPlanType} onChange={(e) => saveAccount({ ...current, growthPlanType: e.target.value as AccountRecord['growthPlanType'] })}>
                        <option value="">Select...</option>
                        <option value="de_novo">De novo / scratch</option>
                        <option value="acquisition">Acquisition</option>
                        <option value="both">Both</option>
                      </select>
                    </label>
                    <label className="text-sm">Funding Model
                      <select className="input" value={current.fundingModelType} onChange={(e) => saveAccount({ ...current, fundingModelType: e.target.value as AccountRecord['fundingModelType'] })}>
                        <option value="">Select...</option>
                        <option value="pe_backed">PE-backed</option>
                        <option value="self_funded">Self-funded</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid md:grid-cols-3 gap-2">
                    <label className="text-sm">Locations added (last 12 months)<input className="input" value={current.locationsAdded12m} onChange={(e) => saveAccount({ ...current, locationsAdded12m: e.target.value })} /></label>
                    <label className="text-sm">Locations sold (last 12 months)<input className="input" value={current.locationsSold12m} onChange={(e) => saveAccount({ ...current, locationsSold12m: e.target.value })} /></label>
                    <label className="text-sm">12-month growth context<textarea className="input min-h-20" value={current.growth12mContext} onChange={(e) => saveAccount({ ...current, growth12mContext: e.target.value })} /></label>
                  </div>
                  <div className="grid md:grid-cols-3 gap-2">
                    <label className="text-sm">Already standardized<textarea className="input min-h-20" value={current.standardizationCurrent} onChange={(e) => saveAccount({ ...current, standardizationCurrent: e.target.value })} /></label>
                    <label className="text-sm">Still varies<textarea className="input min-h-20" value={current.standardizationVaries} onChange={(e) => saveAccount({ ...current, standardizationVaries: e.target.value })} /></label>
                    <label className="text-sm">Wants to standardize<textarea className="input min-h-20" value={current.standardizationTarget} onChange={(e) => saveAccount({ ...current, standardizationTarget: e.target.value })} /></label>
                  </div>
                </div>}

                {sectionId === 'people_ownership' && <div className="space-y-3 border rounded p-3 bg-slate-50">
                  <div className="grid md:grid-cols-2 gap-2">
                    <label className="text-sm">Executive Sponsor<input className="input" value={current.executiveSponsor} onChange={(e) => saveAccount({ ...current, executiveSponsor: e.target.value })} /></label>
                    <label className="text-sm">Operational Champion<input className="input" value={current.operationalChampion} onChange={(e) => saveAccount({ ...current, operationalChampion: e.target.value })} /></label>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    <label className="text-sm">Decision Model
                      <select className="input" value={current.decisionModelType} onChange={(e) => saveAccount({ ...current, decisionModelType: e.target.value })}>
                        <option value="">Select...</option>
                        {decisionModels.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="text-sm">Decision Summary<textarea className="input min-h-20" value={current.decisionModelNarrative} onChange={(e) => saveAccount({ ...current, decisionModelNarrative: e.target.value })} /></label>
                  </div>
                  <div>
                    <div className="label">Key contacts (expandable list)</div>
                    <button className="btn-outline my-2" onClick={() => {
                      const next: StakeholderContact = { id: crypto.randomUUID(), name: '', title: '', functionArea: '', sentiment: 'unknown', notes: '' };
                      saveAccount({ ...current, stakeholders: [...current.stakeholders, next] });
                    }}>Add Contact</button>
                    <div className="space-y-2">
                      {current.stakeholders.map((s, idx) => <div key={s.id} className="grid md:grid-cols-6 gap-2 border rounded p-2 bg-white">
                        <input className="input" placeholder="Name" value={s.name} onChange={(e) => {
                          const stakeholders = [...current.stakeholders]; stakeholders[idx] = { ...s, name: e.target.value }; saveAccount({ ...current, stakeholders });
                        }} />
                        <input className="input" placeholder="Title" value={s.title} onChange={(e) => {
                          const stakeholders = [...current.stakeholders]; stakeholders[idx] = { ...s, title: e.target.value }; saveAccount({ ...current, stakeholders });
                        }} />
                        <input className="input" placeholder="Function" value={s.functionArea} onChange={(e) => {
                          const stakeholders = [...current.stakeholders]; stakeholders[idx] = { ...s, functionArea: e.target.value }; saveAccount({ ...current, stakeholders });
                        }} />
                        <select className="input" value={s.sentiment} onChange={(e) => {
                          const stakeholders = [...current.stakeholders]; stakeholders[idx] = { ...s, sentiment: e.target.value as StakeholderContact['sentiment'] }; saveAccount({ ...current, stakeholders });
                        }}><option value="promoter">promoter</option><option value="neutral">neutral</option><option value="detractor">detractor</option><option value="unknown">unknown</option></select>
                        <input className="input md:col-span-2" placeholder="Notes" value={s.notes} onChange={(e) => {
                          const stakeholders = [...current.stakeholders]; stakeholders[idx] = { ...s, notes: e.target.value }; saveAccount({ ...current, stakeholders });
                        }} />
                        <button className="btn-outline md:col-span-6" onClick={() => saveAccount({ ...current, stakeholders: current.stakeholders.filter((row) => row.id !== s.id) })}>Remove contact</button>
                      </div>)}
                    </div>
                  </div>
                </div>}



                {sectionId === 'operations_centralization' && <div className="space-y-3 border rounded p-3 bg-slate-50">
                  <div className="grid md:grid-cols-2 gap-2">
                    <label className="text-sm">Operating model
                      <select className="input" value={current.operationsModel} onChange={(e) => saveAccount({ ...current, operationsModel: e.target.value as AccountRecord['operationsModel'] })}>
                        <option value="">Select...</option>
                        <option value="centralized">Centralized</option>
                        <option value="by_location">By location</option>
                        <option value="mix">Mix</option>
                      </select>
                    </label>
                    <label className="text-sm">Pain point summary<textarea className="input min-h-20" value={current.operationsPainPointNote} onChange={(e) => saveAccount({ ...current, operationsPainPointNote: e.target.value })} /></label>
                  </div>
                  <div>
                    <div className="label">Operational pain points</div>
                    <div className="grid md:grid-cols-3 gap-2 mt-2">
                      {['RCM', 'Growth', 'Collections', 'Workflow Consistency', 'Patient Experience', 'Reporting'].map((pain) => (
                        <label key={pain} className="text-sm"><input type="checkbox" checked={current.operationsPainPoints.includes(pain)} onChange={(e) => {
                          const next = e.target.checked
                            ? [...current.operationsPainPoints, pain]
                            : current.operationsPainPoints.filter((p) => p !== pain);
                          saveAccount({ ...current, operationsPainPoints: next });
                        }} /> {pain}</label>
                      ))}
                    </div>
                  </div>
                </div>}

                {checklistItems.filter((i) => i.sectionId === sectionId).map((item) => {
                  if (item.id === 'commercial_blockers') {
                    const response = current.responses[item.id];
                    return <div className="border rounded p-3 space-y-2 bg-white" key={item.id}>
                      <div className="text-sm font-medium">{item.text}</div>
                      <textarea className="input min-h-24" placeholder="Example: Vendor X contract until 2028, renewal discussion starts Q4 2027..." value={response?.answer ?? ''} onChange={(e) => saveAccount({ ...current, responses: { ...current.responses, [item.id]: { ...response, answer: e.target.value } } })} />
                      <div className="grid md:grid-cols-3 gap-2">
                        <input className="input" placeholder="Next step (optional)" value={response?.followUpNote ?? ''} onChange={(e) => saveAccount({ ...current, responses: { ...current.responses, [item.id]: { ...response, followUpNote: e.target.value } } })} />
                        <input className="input" placeholder="Owner (optional)" value={response?.owner ?? ''} onChange={(e) => saveAccount({ ...current, responses: { ...current.responses, [item.id]: { ...response, owner: e.target.value } } })} />
                        <input type="date" className="input" value={response?.dueDate ?? ''} onChange={(e) => saveAccount({ ...current, responses: { ...current.responses, [item.id]: { ...response, dueDate: e.target.value } } })} />
                      </div>
                      <button className="btn-outline" onClick={() => createActionFromPrompt(item.id, 'risk')}>Create action from blockers</button>
                    </div>;
                  }
                  return <SectionItemCard key={item.id} item={item} response={current.responses[item.id]} onChange={(response) => saveAccount({ ...current, responses: { ...current.responses, [item.id]: response } })} onCreateAction={() => createActionFromPrompt(item.id, item.kind === 'opportunity' ? 'opportunity' : item.kind === 'risk' ? 'risk' : 'follow_up')} />;
                })}
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
