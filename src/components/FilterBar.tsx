export function FilterBar({ tab, setTab }: { tab: string; setTab: (v: string) => void }) {
  const tabs = ['Summary', 'Audit', 'Product Adoption', 'Risk Register', 'Opportunity Register', 'Action Register', 'Snapshots'];
  return <div className="flex flex-wrap gap-2">{tabs.map((t) => <button key={t} className={tab === t ? 'btn' : 'btn-outline'} onClick={() => setTab(t)}>{t}</button>)}</div>;
}
