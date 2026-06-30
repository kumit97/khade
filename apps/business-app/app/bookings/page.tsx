import { requireBusiness } from '@/lib/auth';
import { BOOKING_STATUS_LABELS, type BookingStatus } from '@khade/shared';
import { updateBookingStatus } from './actions';

export const dynamic = 'force-dynamic';

function ActionButton({
  bookingId,
  next,
  label,
  danger,
}: {
  bookingId: string;
  next: BookingStatus;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={updateBookingStatus} style={{ display: 'inline' }}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="next" value={next} />
      <button type="submit" className={danger ? 'danger' : ''}>
        {label}
      </button>
    </form>
  );
}

export default async function AppointmentsPage() {
  const { supabase, business } = await requireBusiness();
  const { data } = await supabase
    .from('bookings')
    .select('id, starts_at, status, price, currency, services(name)')
    .eq('business_id', business.id)
    .order('starts_at', { ascending: false })
    .limit(100);
  const rows = (data ?? []) as any[];

  return (
    <>
      <h2 className="page-title">Appointments</h2>
      {rows.length === 0 ? (
        <div className="empty">No appointments yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Service</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>{new Date(b.starts_at).toLocaleString()}</td>
                <td>{b.services?.name ?? '—'}</td>
                <td>
                  <span className={`badge ${b.status}`}>
                    {BOOKING_STATUS_LABELS[b.status as BookingStatus]}
                  </span>
                </td>
                <td>
                  {b.currency} {Number(b.price).toFixed(2)}
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {b.status === 'pending' && (
                    <>
                      <ActionButton bookingId={b.id} next="confirmed" label="Accept" />
                      <ActionButton bookingId={b.id} next="rejected" label="Decline" danger />
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <>
                      <ActionButton bookingId={b.id} next="completed" label="Complete" />
                      <ActionButton bookingId={b.id} next="no_show" label="No-show" danger />
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
