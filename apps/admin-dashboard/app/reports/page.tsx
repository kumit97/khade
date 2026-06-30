import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';
import { DEFAULT_COMMISSION_PCT } from '@khade/shared';

export const dynamic = 'force-dynamic';

/**
 * MVP reporting. GMV is summed from paid bookings; commission (revenue) is
 * derived at the platform rate. MRR/ARR/CAC/LTV require subscription &
 * acquisition data not modelled in the MVP — surfaced as "needs data source".
 */
export default async function ReportsPage() {
  await requireAdmin();
  const db = createAdminSupabase();

  const { data: paid } = await db
    .from('bookings')
    .select('price, discount_amount')
    .eq('payment_status', 'paid');

  const gmv = (paid ?? []).reduce(
    (sum, b: any) => sum + Number(b.price) - Number(b.discount_amount ?? 0),
    0,
  );
  const commissionRevenue = (gmv * DEFAULT_COMMISSION_PCT) / 100;

  const metrics = [
    ['GMV (paid bookings)', `$${gmv.toFixed(2)}`, true],
    [`Commission revenue (${DEFAULT_COMMISSION_PCT}%)`, `$${commissionRevenue.toFixed(2)}`, true],
    ['MRR', 'needs subscription model', false],
    ['ARR', 'needs subscription model', false],
    ['CAC', 'needs acquisition spend feed', false],
    ['LTV', 'needs cohort retention feed', false],
  ] as const;

  return (
    <>
      <h2 className="page-title">Reports</h2>
      <div className="cards">
        {metrics.map(([label, value, live]) => (
          <div className="card" key={label}>
            <div className="label">{label}</div>
            <div className="value" style={{ color: live ? undefined : 'var(--muted)', fontSize: live ? 26 : 14 }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
