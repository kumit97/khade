import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getMetrics() {
  const db = createAdminSupabase();
  const [{ count: users }, { count: businesses }, { count: pending }, { count: bookings }] =
    await Promise.all([
      db.from('users').select('*', { count: 'exact', head: true }),
      db.from('businesses').select('*', { count: 'exact', head: true }),
      db
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .in('verification_status', ['pending', 'in_review']),
      db.from('bookings').select('*', { count: 'exact', head: true }),
    ]);
  return {
    users: users ?? 0,
    businesses: businesses ?? 0,
    pending: pending ?? 0,
    bookings: bookings ?? 0,
  };
}

export default async function OverviewPage() {
  await requireAdmin();
  const m = await getMetrics();

  const cards = [
    ['Total users', m.users],
    ['Businesses', m.businesses],
    ['Awaiting verification', m.pending],
    ['Total bookings', m.bookings],
  ] as const;

  return (
    <>
      <h2 className="page-title">Platform overview</h2>
      <div className="cards">
        {cards.map(([label, value]) => (
          <div className="card" key={label}>
            <div className="label">{label}</div>
            <div className="value">{value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <p style={{ color: 'var(--muted)', marginTop: 24 }}>
        GMV / MRR / ARR / CAC / LTV reports are wired in <a href="/reports">Reports</a>.
      </p>
    </>
  );
}
