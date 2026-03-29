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
    <aside className="w-72 bg-white border-r border-slate-100 p-4 flex flex-col relative overflow-hidden">
      <div className="space-y-4 z-10">
        <div className="space-y-2">
          <img
            src="https://www.planetdds.com/wp-content/uploads/2024/02/planet-dds-logo.svg"
            alt="Planet DDS"
            className="h-8 w-auto"
          />
          <h1 className="text-lg font-semibold text-slate-900">Strategic Account Audit</h1>
        </div>

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
        <nav className="space-y-2 pb-36">
          <div className="label">Sections</div>
          {Object.entries(sectionLabels).map(([id, label]) => (
            <button key={id} className="text-left block text-sm text-slate-700 hover:text-indigo-700" onClick={() => props.onJump(id as SectionId)}>
              {label}
            </button>
          ))}
        </nav>
      </div>

      <img
        src="https://www.planetdds.com/wp-content/uploads/2024/03/hero-astronaut.png"
        alt="Planet DDS astronaut"
        className="absolute bottom-0 left-0 w-44 opacity-30 pointer-events-none select-none"
      />
      <div className="absolute -bottom-8 -right-8 h-44 w-44 rounded-full bg-gradient-to-br from-indigo-200/50 to-blue-200/40 blur-2xl" />
    </aside>
  );
}
