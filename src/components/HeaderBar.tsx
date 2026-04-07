import type { AccountRecord } from '../types';

export function HeaderBar({ account, onSaveSnapshot, controls, onUpdateIdentity }: { account: AccountRecord; onSaveSnapshot: () => void; controls: React.ReactNode; onUpdateIdentity: (patch: Partial<AccountRecord>) => void; }) {
  return (
    <header className="flex items-end justify-between bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <label>Account<input className="input" value={account.accountName} onChange={(e) => onUpdateIdentity({ accountName: e.target.value })} /></label>
        <label>CRM Ref<input className="input" value={account.crmRef} onChange={(e) => onUpdateIdentity({ crmRef: e.target.value })} /></label>
        <label>Account Manager<input className="input" value={account.accountManager} onChange={(e) => onUpdateIdentity({ accountManager: e.target.value })} /></label>
        <label>Updated<input className="input" value={new Date(account.updatedAt).toLocaleString()} readOnly /></label>
      </div>
      <div className="flex gap-2 items-center">
        {controls}
        <button className="btn" onClick={onSaveSnapshot}>Save Snapshot</button>
      </div>
    </header>
  );
}
