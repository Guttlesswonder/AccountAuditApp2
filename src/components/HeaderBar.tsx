import type { AccountRecord } from '../types';

export function HeaderBar({ account, onSaveSnapshot, controls }: { account: AccountRecord; onSaveSnapshot: () => void; controls: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <label>Account<input className="input" value={account.accountName} readOnly /></label>
        <label>CRM Ref<input className="input" value={account.crmRef} readOnly /></label>
        <label>Account Manager<input className="input" value={account.accountManager} readOnly /></label>
        <label>Updated<input className="input" value={new Date(account.updatedAt).toLocaleString()} readOnly /></label>
      </div>
      <div className="flex gap-2 items-center">
        {controls}
        <button className="btn" onClick={onSaveSnapshot}>Save Snapshot</button>
      </div>
    </header>
  );
}
