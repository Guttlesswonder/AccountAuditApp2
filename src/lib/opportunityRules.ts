import { productCatalog } from '../data/productCatalog';
import type { AccountRecord, OpportunityItem } from '../types';

export function deriveOpportunities(account: AccountRecord): OpportunityItem[] {
  const entries = Object.entries(account.responses);
  const responseText = entries.map(([, r]) => `${r.answer} ${r.followUpNote}`).join(' ').toLowerCase();
  const has = (term: string) => responseText.includes(term);

  const candidates: OpportunityItem[] = [];
  const suggest = (title: string, platform: string, category: string, whyItFits: string, linkedEvidence: string, confidence: 'high' | 'medium' | 'low' = 'medium') => {
    candidates.push({ id: `${platform}_${title}`.replace(/\s+/g, '_').toLowerCase(), title, platform, category, whyItFits, linkedEvidence, confidence });
  };

  if (has('communication') || has('recall') || has('engagement')) {
    if (account.hasDenticon) suggest('Denticon Patient Communication', 'Denticon', 'Patient Communication', 'Communication gap surfaced in operations responses.', 'patient_communication', 'high');
    if (account.hasCloud9) suggest('Connect', 'Cloud 9', 'Patient Communication', 'Communication workflows indicate platform fit.', 'patient_communication');
    suggest('MyTooth', account.hasCloud9 ? 'Cloud 9' : 'Denticon', 'Patient Communication', 'Patient engagement expansion candidate.', 'patient_communication');
  }
  if (has('bi') || has('report') || has('dashboard') || has('warehouse')) {
    if (account.hasDenticon) suggest('DPA: Data Share', 'Denticon', 'Data & BI', 'BI maturity and reporting needs identified.', 'bi_maturity');
    if (account.hasCloud9) suggest('CBS: Data Share', 'Cloud 9', 'Data & BI', 'Data access gaps indicate whitespace.', 'bi_maturity');
    suggest('XVWeb Analytics Dashboard', account.hasApteryx ? 'Apteryx' : 'Denticon', 'Data & BI', 'Executive metrics visibility requested.', 'bi_maturity');
  }
  if (has('insurance') || has('835') || has('era')) {
    suggest('835 ERA Unlimited', 'Denticon', 'Insurance Workflow', 'Insurance processing friction noted.', 'insurance_processing');
    suggest('AutoEligibility', 'Denticon', 'Insurance Workflow', 'Coverage verification complexity noted.', 'insurance_processing', 'low');
  }
  if (has('ai')) {
    suggest('AI Agents', account.hasCloud9 ? 'Cloud 9' : 'Denticon', 'AI', 'AI interest in technical roadmap.', 'advanced_tools');
    if (account.hasDenticon) suggest('AI Voice Perio', 'Denticon', 'AI', 'Clinical AI conversation surfaced.', 'advanced_tools', 'low');
  }
  if (has('3d') || has('imaging')) suggest('XVWeb 3D Module', account.hasApteryx ? 'Apteryx' : 'Denticon', 'Imaging', '3D/imaging gap identified.', 'advanced_tools');
  if (has('sso') || has('identity')) suggest('Single-Sign On', 'Denticon', 'Identity', 'Identity friction indicated by stakeholders.', 'people_ownership');
  const orthoSelected = account.specialtyCoverage?.some((s) => s.specialty === 'Ortho' && s.selected);
  if ((has('ortho') || orthoSelected) && account.hasDenticon) suggest('Ortho Suite', 'Denticon', 'Specialty', 'Ortho workflow demand surfaced.', 'growth_practice');

  return candidates.filter((item, idx, arr) => arr.findIndex((x) => x.title === item.title && x.platform === item.platform) === idx);
}

export function reorderProductsByPlatform(active: string[]) {
  return [...productCatalog].sort((a, b) => {
    const aActive = active.includes(a.platform) ? 0 : 1;
    const bActive = active.includes(b.platform) ? 0 : 1;
    return aActive - bActive || a.platform.localeCompare(b.platform) || a.name.localeCompare(b.name);
  });
}
