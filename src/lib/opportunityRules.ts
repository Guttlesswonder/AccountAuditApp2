import { productCatalog } from '../data/productCatalog';
import type { AccountRecord, OpportunityItem } from '../types';

export function deriveOpportunities(account: AccountRecord): OpportunityItem[] {
  const entries = Object.entries(account.responses);
  const responseText = `${entries.map(([, r]) => `${r.answer} ${r.followUpNote}`).join(' ')} ${account.patientCommunicationModel} ${account.insuranceProcessingModel} ${account.operationsPainPointNote} ${account.thirdPartyVendorsSummary} ${account.technologyGapSummary} ${account.vendorPainPointSummary} ${account.solveByProductOrRoadmap} ${account.dataWarehouseTools}`.toLowerCase();
  const has = (term: string) => responseText.includes(term);

  const candidates: OpportunityItem[] = [];
  const suggest = (title: string, platform: string, category: string, whyItFits: string, linkedEvidence: string, confidence: 'high' | 'medium' | 'low' = 'medium') => {
    candidates.push({ id: `${platform}_${title}`.replace(/\s+/g, '_').toLowerCase(), title, platform, category, whyItFits, linkedEvidence, confidence });
  };

  if (has('communication') || has('recall') || has('engagement')) {
    if (account.hasDenticon) suggest('Denticon Patient Communication', 'Denticon', 'Patient Communication', 'Communication gap surfaced in operations responses.', 'operations_centralization', 'high');
    if (account.hasCloud9) suggest('Connect', 'Cloud 9', 'Patient Communication', 'Communication workflows indicate platform fit.', 'operations_centralization');
    suggest('MyTooth', account.hasCloud9 ? 'Cloud 9' : 'Denticon', 'Patient Communication', 'Patient engagement expansion candidate.', 'operations_centralization');
  }
  if (has('bi') || has('report') || has('dashboard') || has('warehouse')) {
    if (account.hasDenticon) suggest('DPA: Data Share', 'Denticon', 'Data & BI', 'BI maturity and reporting needs identified.', 'technology_data_vendors');
    if (account.hasCloud9) suggest('CBS: Data Share', 'Cloud 9', 'Data & BI', 'Data access gaps indicate whitespace.', 'technology_data_vendors');
    suggest('XVWeb Analytics Dashboard', account.hasApteryx ? 'Apteryx' : 'Denticon', 'Data & BI', 'Executive metrics visibility requested.', 'technology_data_vendors');
  }
  if (has('insurance') || has('835') || has('era')) {
    suggest('835 ERA Unlimited', 'Denticon', 'Insurance Workflow', 'Insurance processing friction noted.', 'operations_centralization');
    suggest('AutoEligibility', 'Denticon', 'Insurance Workflow', 'Coverage verification complexity noted.', 'operations_centralization', 'low');
  }
  if (has('ai')) {
    suggest('AI Agents', account.hasCloud9 ? 'Cloud 9' : 'Denticon', 'AI', 'AI interest in technical roadmap.', 'technology_data_vendors');
    if (account.hasDenticon) suggest('AI Voice Perio', 'Denticon', 'AI', 'Clinical AI conversation surfaced.', 'technology_data_vendors', 'low');
  }
  if (has('3d') || has('imaging')) suggest('XVWeb 3D Module', account.hasApteryx ? 'Apteryx' : 'Denticon', 'Imaging', '3D/imaging gap identified.', 'technology_data_vendors');
  if (has('sso') || has('identity')) suggest('Single-Sign On', 'Denticon', 'Identity', 'Identity friction indicated by stakeholders.', 'people_ownership');
  const orthoSelected = account.specialtyCoverage?.some((s) => s.specialty === 'Ortho' && s.selected);
  if ((has('ortho') || orthoSelected) && account.hasDenticon) suggest('Ortho Suite', 'Denticon', 'Specialty', 'Ortho workflow demand surfaced.', 'growth_practice');

  account.opportunityAssessment.entries.forEach((entry) => {
    candidates.push({
      id: `assessment_${entry.id}`,
      title: entry.name || 'Whitespace opportunity',
      platform: 'Account Strategy',
      category: entry.productMotion || 'Expansion',
      whyItFits: entry.whyFit || account.opportunityAssessment.rationale,
      confidence: account.opportunityAssessment.confidence.toLowerCase() as 'high' | 'medium' | 'low' || 'medium',
      linkedEvidence: entry.timing || account.opportunityAssessment.evidence,
    });
  });

  return candidates.filter((item, idx, arr) => arr.findIndex((x) => x.title === item.title && x.platform === item.platform) === idx);
}

export function reorderProductsByPlatform(active: string[]) {
  return [...productCatalog].sort((a, b) => {
    const aActive = active.includes(a.platform) ? 0 : 1;
    const bActive = active.includes(b.platform) ? 0 : 1;
    return aActive - bActive || a.platform.localeCompare(b.platform) || a.name.localeCompare(b.name);
  });
}
