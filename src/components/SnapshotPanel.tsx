import type { Snapshot } from '../types';

export function SnapshotPanel({ snapshots }: { snapshots: Snapshot[] }) {
  return <div className="card space-y-2">{[...snapshots].sort((a,b) => a.createdAt.localeCompare(b.createdAt)).map((s) => <div className="border rounded p-2 text-sm" key={s.id}><div className="font-medium">{new Date(s.createdAt).toLocaleString()} - {s.overallPosture}</div><div>Relationship: {s.relationshipHealth} | Retention: {s.retentionRisk} | Growth: {s.growthPotential} | Complexity: {s.operationalComplexity}</div><div>{s.note}</div></div>)}</div>;
}
