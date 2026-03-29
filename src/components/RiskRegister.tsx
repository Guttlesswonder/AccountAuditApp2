import type { RiskItem } from '../types';

export function RiskRegister({ risks }: { risks: RiskItem[] }) {
  return <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Section</th><th>Prompt</th><th>Status</th><th>Answer</th><th>Consequence</th><th>Next Step</th></tr></thead><tbody>{risks.map((r) => <tr key={r.id} className="border-t"><td>{r.section}</td><td>{r.prompt}</td><td>{r.status}</td><td>{r.answer}</td><td>{r.consequence}</td><td>{r.nextStep}</td></tr>)}</tbody></table></div>;
}
