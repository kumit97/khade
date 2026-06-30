import { requireBusiness } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage() {
  const { supabase, business } = await requireBusiness();

  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todays } = await supabase
    .from('bookings')
    .select('id, starts_at, status, price, currency, services(name), customer_id')
    .eq('business_id', business.id)
    .gte('starts_at', today.toISOString())
    .lt('starts_at', tomorrow.toISOString())
    .order('starts_at');

  const { data: paid } = await supabase
    .from('bookings')
    .select('price, discount_amount, starts_at')
    .eq('business_id', business.id)
    .eq('payment_status', 'paid');

  const sumSince = (since: Date) =>
    (paid ?? [])
      .filter((b: any) => new Date(b.starts_at) >= since)
      .reduce((s: number, b: any) => s + Number(b.price) - Number(b.discount_amount ?? 0), 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const rows = (todays ?? []) as any[];

  return (
    <>
      <h2 className="page-title">{business.name} — today</h2>
      <div className="cards">
        <div className="card">
          <div className="label">Today&apos;s bookings</div>
          <div className="value">{rows.length}</div>
        </div>
        <div className="card">
          <div className="label">Revenue (today)</div>
          <div className="value">${sumSince(today).toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="label">Revenue (7d)</div>
          <div className="value">${sumSince(weekAgo).toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="label">Revenue (30d)</div>
          <div className="value">${sumSince(monthAgo).toFixed(2)}</div>
        </div>
      </div>

      <h3 style={{ marginTop: 28 }}>Today&apos;s schedule</h3>
      {rows.length === 0 ? (
        <div className="empty">No bookings today.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Service</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>{new Date(b.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>{b.services?.name ?? '—'}</td>
                <td>
                  <span className={`badge ${b.status}`}>{b.status}</span>
                </td>
                <td>
                  {b.currency} {Number(b.price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
