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
                  <div className="grid md:grid-cols-2 gap-2">
                    <label className="text-sm">How do they currently manage patient communication?
                      <textarea className="input min-h-20" value={current.patientCommunicationModel} onChange={(e) => saveAccount({ ...current, patientCommunicationModel: e.target.value })} />
                    </label>
                    <label className="text-sm">How are insurance payments processed (office level, central, vendor-assisted)?
                      <textarea className="input min-h-20" value={current.insuranceProcessingModel} onChange={(e) => saveAccount({ ...current, insuranceProcessingModel: e.target.value })} />
                    </label>
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



                {sectionId === 'technology_data_vendors' && <div className="space-y-3 border rounded p-3 bg-slate-50">
                  <label className="text-sm">Third-party vendors in use (outside Planet DDS)
                    <textarea className="input min-h-20" value={current.thirdPartyVendorsSummary} onChange={(e) => saveAccount({ ...current, thirdPartyVendorsSummary: e.target.value })} />
                  </label>
                  <div className="grid md:grid-cols-2 gap-2">
                    <label className="text-sm">Technology gaps they want to close
                      <textarea className="input min-h-20" value={current.technologyGapSummary} onChange={(e) => saveAccount({ ...current, technologyGapSummary: e.target.value })} />
                    </label>
                    <label className="text-sm">Current vendor pain points / limitations
                      <textarea className="input min-h-20" value={current.vendorPainPointSummary} onChange={(e) => saveAccount({ ...current, vendorPainPointSummary: e.target.value })} />
                    </label>
                  </div>
                  <label className="text-sm">Could any pain points be solved by our products or roadmap features?
                    <textarea className="input min-h-20" value={current.solveByProductOrRoadmap} onChange={(e) => saveAccount({ ...current, solveByProductOrRoadmap: e.target.value })} />
                  </label>
                  <div className="grid md:grid-cols-2 gap-2">
                    <label className="text-sm"><input type="checkbox" checked={current.hasDataWarehouse} onChange={(e) => saveAccount({ ...current, hasDataWarehouse: e.target.checked })} /> Has data warehouse</label>
                    {current.hasDataWarehouse && <label className="text-sm">Tools used for central reporting / BI
                      <input className="input" value={current.dataWarehouseTools} onChange={(e) => saveAccount({ ...current, dataWarehouseTools: e.target.value })} />
                    </label>}
                  </div>
                </div>}



                {sectionId === 'health_risk_growth' && <div className="space-y-4">
                  <div className="card border-slate-200 shadow-md">
                    <h4 className="font-semibold mb-3">What is the current overall sentiment of the customer, leadership, operational, & technical?</h4>
                    <div className="grid md:grid-cols-3 gap-2">
                      <label className="text-sm">Sentiment
                        <select className="input" value={current.sentimentAssessment.overallScore} onChange={(e) => saveAccount({ ...current, sentimentAssessment: { ...current.sentimentAssessment, overallScore: e.target.value as typeof current.sentimentAssessment.overallScore } })}><option value="">Select sentiment</option><option>Very Positive</option><option>Positive</option><option>Mixed</option><option>Negative</option><option>Critical</option></select>
                      </label>
                      <label className="text-sm">Confidence
                        <select className="input" value={current.sentimentAssessment.confidence} onChange={(e) => saveAccount({ ...current, sentimentAssessment: { ...current.sentimentAssessment, confidence: e.target.value as typeof current.sentimentAssessment.confidence } })}><option value="">Select confidence</option><option>High</option><option>Medium</option><option>Low</option></select>
                      </label>
                      <label className="text-sm">Evidence date<input type="date" className="input" value={current.sentimentAssessment.evidenceDate} onChange={(e) => saveAccount({ ...current, sentimentAssessment: { ...current.sentimentAssessment, evidenceDate: e.target.value } })} /></label>
                    </div>
                    <label className="text-sm mt-2 block">Rationale<textarea className="input min-h-24" placeholder="Summarize the current customer tone, trust level, stakeholder alignment, and recent signals" value={current.sentimentAssessment.rationale} onChange={(e) => saveAccount({ ...current, sentimentAssessment: { ...current.sentimentAssessment, rationale: e.target.value } })} /></label>
                    <label className="text-sm mt-2 block">Evidence / proof points<textarea className="input min-h-24" placeholder="Example: renewal posture, escalation trend, executive responsiveness, technical complaints, operational adoption signals" value={current.sentimentAssessment.evidence} onChange={(e) => saveAccount({ ...current, sentimentAssessment: { ...current.sentimentAssessment, evidence: e.target.value } })} /></label>
                  </div>

                  <div className="card border-slate-200 shadow-md">
                    <h4 className="font-semibold mb-3">What are the top retention risks or pressure points right now?</h4>
                    <div className="grid md:grid-cols-4 gap-2">
                      <label className="text-sm">Risk level<select className="input" value={current.retentionAssessment.overallScore} onChange={(e) => saveAccount({ ...current, retentionAssessment: { ...current.retentionAssessment, overallScore: e.target.value as typeof current.retentionAssessment.overallScore } })}><option value="">Select risk level</option><option>Low Risk</option><option>Moderate Risk</option><option>High Risk</option><option>Critical Risk</option></select></label>
                      <label className="text-sm">Confidence<select className="input" value={current.retentionAssessment.confidence} onChange={(e) => saveAccount({ ...current, retentionAssessment: { ...current.retentionAssessment, confidence: e.target.value as typeof current.retentionAssessment.confidence } })}><option value="">Select confidence</option><option>High</option><option>Medium</option><option>Low</option></select></label>
                      <label className="text-sm">Evidence date<input type="date" className="input" value={current.retentionAssessment.evidenceDate} onChange={(e) => saveAccount({ ...current, retentionAssessment: { ...current.retentionAssessment, evidenceDate: e.target.value } })} /></label>
                      <label className="text-sm">Owner<input className="input" value={current.retentionAssessment.owner ?? ''} onChange={(e) => saveAccount({ ...current, retentionAssessment: { ...current.retentionAssessment, owner: e.target.value } })} /></label>
                    </div>
                    <label className="text-sm mt-2 block">Rationale<textarea className="input min-h-24" placeholder="Summarize the most important retention pressure points" value={current.retentionAssessment.rationale} onChange={(e) => saveAccount({ ...current, retentionAssessment: { ...current.retentionAssessment, rationale: e.target.value } })} /></label>
                    <label className="text-sm mt-2 block">Evidence / examples<textarea className="input min-h-24" placeholder="Example: open escalations, pricing pressure, unresolved defects, low adoption, competitor threat, leadership dissatisfaction" value={current.retentionAssessment.evidence} onChange={(e) => saveAccount({ ...current, retentionAssessment: { ...current.retentionAssessment, evidence: e.target.value } })} /></label>
                    <button className="btn-outline mt-2" onClick={() => saveAccount({ ...current, retentionAssessment: { ...current.retentionAssessment, entries: [...current.retentionAssessment.entries, { id: crypto.randomUUID(), title: '', severity: '', likelihood: '', timing: '', notes: '' }] } })}>Add Risk Entry</button>
                    <div className="space-y-2 mt-2">{(current.retentionAssessment.entries ?? []).map((entry, idx) => <div key={entry.id} className="grid md:grid-cols-5 gap-2 border rounded-lg p-2"><input className="input" placeholder="Risk title" value={entry.title} onChange={(e) => { const entries=[...current.retentionAssessment.entries]; entries[idx]={...entry,title:e.target.value}; saveAccount({ ...current, retentionAssessment:{...current.retentionAssessment, entries} }); }} /><input className="input" placeholder="Severity" value={entry.severity} onChange={(e)=>{ const entries=[...current.retentionAssessment.entries]; entries[idx]={...entry,severity:e.target.value}; saveAccount({ ...current, retentionAssessment:{...current.retentionAssessment, entries} });}}/><input className="input" placeholder="Likelihood" value={entry.likelihood} onChange={(e)=>{ const entries=[...current.retentionAssessment.entries]; entries[idx]={...entry,likelihood:e.target.value}; saveAccount({ ...current, retentionAssessment:{...current.retentionAssessment, entries} });}}/><input className="input" placeholder="Timing/Urgency" value={entry.timing} onChange={(e)=>{ const entries=[...current.retentionAssessment.entries]; entries[idx]={...entry,timing:e.target.value}; saveAccount({ ...current, retentionAssessment:{...current.retentionAssessment, entries} });}}/><input className="input" placeholder="Notes" value={entry.notes} onChange={(e)=>{ const entries=[...current.retentionAssessment.entries]; entries[idx]={...entry,notes:e.target.value}; saveAccount({ ...current, retentionAssessment:{...current.retentionAssessment, entries} });}}/></div>)}</div>
                  </div>

                  <div className="card border-slate-200 shadow-md">
                    <h4 className="font-semibold mb-3">What are the top whitespace opportunities based on current gaps, unsold add ons, location expansion, or adjacent needs?</h4>
                    <div className="grid md:grid-cols-4 gap-2">
                      <label className="text-sm">Opportunity level<select className="input" value={current.opportunityAssessment.overallScore} onChange={(e) => saveAccount({ ...current, opportunityAssessment: { ...current.opportunityAssessment, overallScore: e.target.value as typeof current.opportunityAssessment.overallScore } })}><option value="">Select opportunity level</option><option>Strong Opportunity</option><option>Qualified Opportunity</option><option>Early Opportunity</option><option>Limited Opportunity</option><option>No Clear Opportunity</option></select></label>
                      <label className="text-sm">Confidence<select className="input" value={current.opportunityAssessment.confidence} onChange={(e) => saveAccount({ ...current, opportunityAssessment: { ...current.opportunityAssessment, confidence: e.target.value as typeof current.opportunityAssessment.confidence } })}><option value="">Select confidence</option><option>High</option><option>Medium</option><option>Low</option></select></label>
                      <label className="text-sm">Evidence date<input type="date" className="input" value={current.opportunityAssessment.evidenceDate} onChange={(e) => saveAccount({ ...current, opportunityAssessment: { ...current.opportunityAssessment, evidenceDate: e.target.value } })} /></label>
                      <label className="text-sm">Owner<input className="input" value={current.opportunityAssessment.owner ?? ''} onChange={(e) => saveAccount({ ...current, opportunityAssessment: { ...current.opportunityAssessment, owner: e.target.value } })} /></label>
                    </div>
                    <label className="text-sm mt-2 block">Rationale<textarea className="input min-h-24" placeholder="Summarize the best expansion paths based on current gaps, products not yet sold, rollout potential, or adjacent needs" value={current.opportunityAssessment.rationale} onChange={(e) => saveAccount({ ...current, opportunityAssessment: { ...current.opportunityAssessment, rationale: e.target.value } })} /></label>
                    <label className="text-sm mt-2 block">Evidence / proof points<textarea className="input min-h-24" value={current.opportunityAssessment.evidence} onChange={(e) => saveAccount({ ...current, opportunityAssessment: { ...current.opportunityAssessment, evidence: e.target.value } })} /></label>
                    <button className="btn-outline mt-2" onClick={() => saveAccount({ ...current, opportunityAssessment: { ...current.opportunityAssessment, entries: [...current.opportunityAssessment.entries, { id: crypto.randomUUID(), name: '', productMotion: '', whyFit: '', timing: '', value: '' }] } })}>Add Opportunity Entry</button>
                    <div className="space-y-2 mt-2">{(current.opportunityAssessment.entries ?? []).map((entry, idx) => <div key={entry.id} className="grid md:grid-cols-5 gap-2 border rounded-lg p-2"><input className="input" placeholder="Opportunity name" value={entry.name} onChange={(e)=>{ const entries=[...current.opportunityAssessment.entries]; entries[idx]={...entry,name:e.target.value}; saveAccount({ ...current, opportunityAssessment:{...current.opportunityAssessment, entries} });}}/><input className="input" placeholder="Product / motion" value={entry.productMotion} onChange={(e)=>{ const entries=[...current.opportunityAssessment.entries]; entries[idx]={...entry,productMotion:e.target.value}; saveAccount({ ...current, opportunityAssessment:{...current.opportunityAssessment, entries} });}}/><input className="input" placeholder="Why it fits" value={entry.whyFit} onChange={(e)=>{ const entries=[...current.opportunityAssessment.entries]; entries[idx]={...entry,whyFit:e.target.value}; saveAccount({ ...current, opportunityAssessment:{...current.opportunityAssessment, entries} });}}/><input className="input" placeholder="Estimated timing" value={entry.timing} onChange={(e)=>{ const entries=[...current.opportunityAssessment.entries]; entries[idx]={...entry,timing:e.target.value}; saveAccount({ ...current, opportunityAssessment:{...current.opportunityAssessment, entries} });}}/><input className="input" placeholder="Strategic / revenue value" value={entry.value} onChange={(e)=>{ const entries=[...current.opportunityAssessment.entries]; entries[idx]={...entry,value:e.target.value}; saveAccount({ ...current, opportunityAssessment:{...current.opportunityAssessment, entries} });}}/></div>)}</div>
                  </div>

                  <div className="card border-slate-200 shadow-md">
                    <h4 className="font-semibold mb-3">What are the top 3 next actions we should take internally or with the customer?</h4>
                    <div className="grid md:grid-cols-3 gap-2">
                      <label className="text-sm">Priority<select className="input" value={current.nextActionAssessment.overallScore} onChange={(e) => saveAccount({ ...current, nextActionAssessment: { ...current.nextActionAssessment, overallScore: e.target.value as typeof current.nextActionAssessment.overallScore } })}><option value="">Select priority</option><option>Immediate Action Needed</option><option>High Priority</option><option>Medium Priority</option><option>Low Priority</option></select></label>
                      <label className="text-sm">Confidence<select className="input" value={current.nextActionAssessment.confidence} onChange={(e) => saveAccount({ ...current, nextActionAssessment: { ...current.nextActionAssessment, confidence: e.target.value as typeof current.nextActionAssessment.confidence } })}><option value="">Select confidence</option><option>High</option><option>Medium</option><option>Low</option></select></label>
                      <label className="text-sm">Evidence date<input type="date" className="input" value={current.nextActionAssessment.evidenceDate} onChange={(e) => saveAccount({ ...current, nextActionAssessment: { ...current.nextActionAssessment, evidenceDate: e.target.value } })} /></label>
                    </div>
                    <label className="text-sm mt-2 block">Rationale<textarea className="input min-h-24" value={current.nextActionAssessment.rationale} onChange={(e) => saveAccount({ ...current, nextActionAssessment: { ...current.nextActionAssessment, rationale: e.target.value } })} /></label>
                    <label className="text-sm mt-2 block">Evidence<textarea className="input min-h-24" value={current.nextActionAssessment.evidence} onChange={(e) => saveAccount({ ...current, nextActionAssessment: { ...current.nextActionAssessment, evidence: e.target.value } })} /></label>
                    <div className="space-y-2 mt-2">{(current.nextActionAssessment.entries ?? []).map((entry, idx) => <div key={entry.id} className="grid md:grid-cols-6 gap-2 border rounded-lg p-2"><input className="input" placeholder="Action" value={entry.action} onChange={(e)=>{ const entries=[...current.nextActionAssessment.entries]; entries[idx]={...entry,action:e.target.value}; saveAccount({ ...current, nextActionAssessment:{...current.nextActionAssessment, entries} });}}/><input className="input" placeholder="Owner" value={entry.owner} onChange={(e)=>{ const entries=[...current.nextActionAssessment.entries]; entries[idx]={...entry,owner:e.target.value}; saveAccount({ ...current, nextActionAssessment:{...current.nextActionAssessment, entries} });}}/><input type="date" className="input" value={entry.targetDate} onChange={(e)=>{ const entries=[...current.nextActionAssessment.entries]; entries[idx]={...entry,targetDate:e.target.value}; saveAccount({ ...current, nextActionAssessment:{...current.nextActionAssessment, entries} });}}/><select className="input" value={entry.audience} onChange={(e)=>{ const entries=[...current.nextActionAssessment.entries]; entries[idx]={...entry,audience:e.target.value as 'internal'|'customer'}; saveAccount({ ...current, nextActionAssessment:{...current.nextActionAssessment, entries} });}}><option value="internal">Internal</option><option value="customer">Customer-facing</option></select><select className="input" value={entry.priority} onChange={(e)=>{ const entries=[...current.nextActionAssessment.entries]; entries[idx]={...entry,priority:e.target.value}; saveAccount({ ...current, nextActionAssessment:{...current.nextActionAssessment, entries} });}}><option value="">Select priority</option><option>Immediate Action Needed</option><option>High Priority</option><option>Medium Priority</option><option>Low Priority</option></select><input className="input" placeholder="Notes" value={entry.notes} onChange={(e)=>{ const entries=[...current.nextActionAssessment.entries]; entries[idx]={...entry,notes:e.target.value}; saveAccount({ ...current, nextActionAssessment:{...current.nextActionAssessment, entries} });}}/></div>)}</div>
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
