import type { AccountRecord, ProductAdoption } from '../types';
import { reorderProductsByPlatform } from '../lib/opportunityRules';

export function ProductAdoptionTable({ account, onUpdate }: { account: AccountRecord; onUpdate: (id: string, row: ProductAdoption) => void }) {
  const active = [account.hasDenticon && 'Denticon', account.hasCloud9 && 'Cloud 9', account.hasApteryx && 'Apteryx'].filter(Boolean) as string[];
  const ordered = reorderProductsByPlatform(active);
  const topOpp = ordered
    .map((p) => ({ product: p, adoption: account.productAdoption[p.id] }))
    .filter((x) => x.adoption?.status !== 'adopted')
    .slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="card grid md:grid-cols-3 gap-2">
        <label><input type="checkbox" checked={account.hasDenticon} onChange={(e) => onUpdate('__platform_denticon', { productId: '__platform_denticon', status: e.target.checked ? 'adopted' : 'unknown', notes: '' })} /> Denticon</label>
        <label><input type="checkbox" checked={account.hasCloud9} onChange={(e) => onUpdate('__platform_cloud9', { productId: '__platform_cloud9', status: e.target.checked ? 'adopted' : 'unknown', notes: '' })} /> Cloud 9</label>
        <label><input type="checkbox" checked={account.hasApteryx} onChange={(e) => onUpdate('__platform_apteryx', { productId: '__platform_apteryx', status: e.target.checked ? 'adopted' : 'unknown', notes: '' })} /> Apteryx</label>
      </div>
      <div className="card">
        <div className="label">Top Whitespace Opportunity Cards</div>
        <div className="grid md:grid-cols-2 gap-2 mt-2">
          {topOpp.map(({ product, adoption }) => <div key={product.id} className="border rounded p-2 text-sm"><strong>{product.name}</strong> ({product.platform})<div>{adoption?.notes || 'Potential expansion candidate'}</div></div>)}
        </div>
      </div>
      <details className="card" open={false}>
        <summary className="cursor-pointer font-medium">Detailed Product Matrix</summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm">
            <thead><tr className="text-left"><th>Product</th><th>Platform</th><th>Status</th><th>Notes</th><th>Opportunity Value</th></tr></thead>
            <tbody>
              {ordered.map((p) => {
                const row = account.productAdoption[p.id] ?? { productId: p.id, status: 'unknown', notes: '', opportunityValue: '' };
                return <tr key={p.id} className="border-t align-top">
                  <td className="py-2 pr-2">{p.name}</td>
                  <td>{p.platform}</td>
                  <td><select className="input" value={row.status} onChange={(e) => onUpdate(p.id, { ...row, status: e.target.value as ProductAdoption['status'] })}><option value="adopted">adopted</option><option value="partial">partial</option><option value="not_adopted">not adopted</option><option value="unknown">unknown</option></select></td>
                  <td><input className="input" value={row.notes} onChange={(e) => onUpdate(p.id, { ...row, notes: e.target.value })} /></td>
                  <td><select className="input" value={row.opportunityValue ?? ''} onChange={(e) => onUpdate(p.id, { ...row, opportunityValue: e.target.value as ProductAdoption['opportunityValue'] })}><option value="">--</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
