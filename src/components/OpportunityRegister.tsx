import type { OpportunityItem } from '../types';

export function OpportunityRegister({ opportunities }: { opportunities: OpportunityItem[] }) {
  return <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Title</th><th>Platform</th><th>Category</th><th>Why it fits</th><th>Confidence</th><th>Evidence</th></tr></thead><tbody>{opportunities.map((o) => <tr key={o.id} className="border-t"><td>{o.title}</td><td>{o.platform}</td><td>{o.category}</td><td>{o.whyItFits}</td><td>{o.confidence}</td><td>{o.linkedEvidence}</td></tr>)}</tbody></table></div>;
}
