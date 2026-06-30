import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';
import { BOOKING_STATUS_LABELS, type BookingStatus } from '@khade/shared';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  await requireAdmin();
  const db = createAdminSupabase();
  const { data } = await db
    .from('bookings')
    .select(
      'id, status, payment_status, starts_at, price, currency, businesses(name), services(name)',
    )
    .order('starts_at', { ascending: false })
    .limit(100);
  const rows = (data ?? []) as any[];

  return (
    <>
      <h2 className="page-title">Platform booking feed</h2>
      {rows.length === 0 ? (
        <div className="empty">No bookings yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Business</th>
              <th>Service</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>{new Date(b.starts_at).toLocaleString()}</td>
                <td>{b.businesses?.name ?? '—'}</td>
                <td>{b.services?.name ?? '—'}</td>
                <td>{BOOKING_STATUS_LABELS[b.status as BookingStatus]}</td>
                <td>{b.payment_status}</td>
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
