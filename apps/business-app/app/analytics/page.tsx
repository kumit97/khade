import { requireBusiness } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const { supabase, business } = await requireBusiness();

  const { data } = await supabase
    .from('bookings')
    .select('starts_at, status, price, discount_amount, service_id, services(name)')
    .eq('business_id', business.id)
    .limit(1000);

  const rows = (data ?? []) as any[];
  const completed = rows.filter((r) => r.status === 'completed');

  // Popular services
  const svc = new Map<string, number>();
  for (const r of completed) {
    const name = r.services?.name ?? '—';
    svc.set(name, (svc.get(name) ?? 0) + 1);
  }
  const popular = [...svc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Peak hours
  const hours = new Array(24).fill(0);
  for (const r of completed) hours[new Date(r.starts_at).getHours()] += 1;
  const peak = hours
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter((h) => h.count > 0);

  return (
    <>
      <h2 className="page-title">Analytics</h2>

      <h3>Popular services</h3>
      {popular.length === 0 ? (
        <div className="empty">Not enough completed bookings yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Completed bookings</th>
            </tr>
          </thead>
          <tbody>
            {popular.map(([name, count]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: 28 }}>Peak booking hours</h3>
      {peak.length === 0 ? (
        <div className="empty">No data yet.</div>
      ) : (
        <ul>
          {peak.map((p) => (
            <li key={p.hour}>
              {String(p.hour).padStart(2, '0')}:00 — {p.count} bookings
            </li>
          ))}
        </ul>
      )}
      <p style={{ color: 'var(--muted)', marginTop: 16 }}>
        Revenue-over-time and repeat-customer-rate charts plug into this same query;
        chart rendering is a follow-up slice.
      </p>
    </>
  );
}
