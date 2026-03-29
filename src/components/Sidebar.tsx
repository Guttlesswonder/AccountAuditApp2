import { sectionLabels } from '../data/checklist';
import type { AccountRecord, ReviewLens, SectionId } from '../types';

export function Sidebar(props: {
  accounts: AccountRecord[];
  currentAccountId: string;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  lens: ReviewLens;
  onLensChange: (lens: ReviewLens) => void;
  onJump: (sectionId: SectionId) => void;
}) {
  return (
    <aside className="w-72 bg-white border-r p-4 space-y-4">
      <h1 className="text-lg font-semibold">Strategic Account Audit</h1>
      <div>
        <div className="label">Account</div>
        <select className="input" value={props.currentAccountId} onChange={(e) => props.onSwitch(e.target.value)}>
          {props.accounts.map((a) => <option key={a.id} value={a.id}>{a.accountName}</option>)}
        </select>
        <div className="flex gap-2 mt-2">
          <button className="btn-outline" onClick={props.onCreate}>Create</button>
          <button className="btn-outline" onClick={props.onDuplicate}>Duplicate</button>
          <button className="btn-outline" onClick={props.onDelete}>Delete</button>
        </div>
      </div>
      <div>
        <div className="label">Review Lens</div>
        <select className="input" value={props.lens} onChange={(e) => props.onLensChange(e.target.value as ReviewLens)}>
          <option value="executive_review">Executive Review</option>
          <option value="relationship">Relationship</option>
          <option value="retention">Retention</option>
          <option value="growth">Growth</option>
        </select>
      </div>
      <nav className="space-y-2">
        <div className="label">Sections</div>
        {Object.entries(sectionLabels).map(([id, label]) => (
          <button key={id} className="text-left block text-sm text-slate-700 hover:text-slate-900" onClick={() => props.onJump(id as SectionId)}>
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
