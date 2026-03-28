import type { ActionItem } from '../types';

export function ActionRegister({ actions, onChange, onAdd, onDelete }: { actions: ActionItem[]; onChange: (next: ActionItem[]) => void; onAdd: () => void; onDelete: (id: string) => void; }) {
  return (
    <div className="space-y-2">
      <button className="btn" onClick={onAdd}>Add Action</button>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm"><thead><tr><th>Title</th><th>Section</th><th>Type</th><th>Owner</th><th>Due</th><th>Note</th><th></th></tr></thead><tbody>
          {actions.map((a, idx) => <tr key={a.id} className="border-t"><td><input className="input" value={a.title} onChange={(e) => { const next = [...actions]; next[idx] = { ...a, title: e.target.value }; onChange(next); }} /></td><td><input className="input" value={a.relatedSection} onChange={(e) => { const next = [...actions]; next[idx] = { ...a, relatedSection: e.target.value }; onChange(next); }} /></td><td><select className="input" value={a.type} onChange={(e) => { const next = [...actions]; next[idx] = { ...a, type: e.target.value as ActionItem['type'] }; onChange(next); }}><option value="risk">risk</option><option value="opportunity">opportunity</option><option value="follow_up">follow up</option></select></td><td><input className="input" value={a.owner} onChange={(e) => { const next = [...actions]; next[idx] = { ...a, owner: e.target.value }; onChange(next); }} /></td><td><input type="date" className="input" value={a.dueDate} onChange={(e) => { const next = [...actions]; next[idx] = { ...a, dueDate: e.target.value }; onChange(next); }} /></td><td><input className="input" value={a.note} onChange={(e) => { const next = [...actions]; next[idx] = { ...a, note: e.target.value }; onChange(next); }} /></td><td><button className="btn-outline" onClick={() => onDelete(a.id)}>Delete</button></td></tr>)}
        </tbody></table>
      </div>
    </div>
  );
}
