import type { ChecklistItem, ResponseRecord, VisibleStatus } from '../types';

const statuses: VisibleStatus[] = ['', 'Confirmed', 'Unknown', 'At Risk', 'Opportunity', 'Not Applicable'];

export function SectionItemCard({ item, response, onChange, onCreateAction }: {
  item: ChecklistItem;
  response: ResponseRecord;
  onChange: (next: ResponseRecord) => void;
  onCreateAction: () => void;
}) {
  const showUnknown = item.mode === 'flaggable' && response.status === 'Unknown';
  const showRisk = item.mode === 'flaggable' && response.status === 'At Risk';
  const showOpp = item.mode === 'flaggable' && response.status === 'Opportunity';
  return (
    <div className="border rounded p-3 space-y-2 bg-white">
      <div className="text-sm font-medium">{item.text}</div>
      <div className="grid md:grid-cols-2 gap-2">
        <select className="input" value={response.status} onChange={(e) => onChange({ ...response, status: e.target.value as VisibleStatus })}>
          {statuses.map((s) => <option key={s} value={s}>{s || 'Select status'}</option>)}
        </select>
        <input className="input" placeholder="Short answer" value={response.answer} onChange={(e) => onChange({ ...response, answer: e.target.value })} />
      </div>
      {(showUnknown || showOpp) && (
        <div className="grid md:grid-cols-3 gap-2">
          <input className="input" placeholder="Follow up note" value={response.followUpNote ?? ''} onChange={(e) => onChange({ ...response, followUpNote: e.target.value })} />
          <input className="input" placeholder="Owner (optional)" value={response.owner ?? ''} onChange={(e) => onChange({ ...response, owner: e.target.value })} />
          <input type="date" className="input" value={response.dueDate ?? ''} onChange={(e) => onChange({ ...response, dueDate: e.target.value })} />
        </div>
      )}
      {showRisk && (
        <div className="grid md:grid-cols-3 gap-2">
          <input className="input" placeholder="Consequence" value={response.consequence ?? ''} onChange={(e) => onChange({ ...response, consequence: e.target.value })} />
          <input className="input" placeholder="Owner (optional)" value={response.owner ?? ''} onChange={(e) => onChange({ ...response, owner: e.target.value })} />
          <input type="date" className="input" value={response.dueDate ?? ''} onChange={(e) => onChange({ ...response, dueDate: e.target.value })} />
        </div>
      )}
      {(showUnknown || showRisk || showOpp) && <button className="btn-outline" onClick={onCreateAction}>Create action from item</button>}
    </div>
  );
}
