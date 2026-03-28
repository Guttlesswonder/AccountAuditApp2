export function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="card">
      <div className="label">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
