import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';
import { createPromo } from './actions';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  await requireAdmin();
  const db = createAdminSupabase();
  // Platform-wide promos only (business_id is null).
  const { data } = await db
    .from('promo_codes')
    .select('id, code, type, value, redeemed_count, max_redemptions, is_active, expires_at')
    .is('business_id', null)
    .order('created_at', { ascending: false });
  const rows = data ?? [];

  return (
    <>
      <h2 className="page-title">Platform promotions</h2>

      <form action={createPromo} className="form" style={{ marginBottom: 24 }}>
        <input name="code" placeholder="CODE e.g. SUMMER20" required />
        <select name="type">
          <option value="percentage">Percentage</option>
          <option value="fixed_amount">Fixed amount</option>
        </select>
        <input name="value" type="number" step="0.01" placeholder="Value" required />
        <button type="submit">Create promo</button>
      </form>

      {rows.length === 0 ? (
        <div className="empty">No platform promo codes yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Redeemed</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.type}</td>
                <td>{p.type === 'percentage' ? `${p.value}%` : p.value}</td>
                <td>
                  {p.redeemed_count}
                  {p.max_redemptions ? ` / ${p.max_redemptions}` : ''}
                </td>
                <td>
                  <span className={`badge ${p.is_active ? 'verified' : 'rejected'}`}>
                    {p.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
