import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';
import { CATEGORY_LABELS, type BusinessCategory } from '@khade/shared';
import { reviewBusiness } from './actions';

export const dynamic = 'force-dynamic';

interface QueueRow {
  id: string;
  name: string;
  category: BusinessCategory;
  city: string | null;
  country: string | null;
  verification_status: string;
  created_at: string;
}

export default async function VerificationQueuePage() {
  await requireAdmin();
  const db = createAdminSupabase();
  const { data } = await db
    .from('businesses')
    .select('id, name, category, city, country, verification_status, created_at')
    .in('verification_status', ['pending', 'in_review'])
    .order('created_at', { ascending: true });

  const rows = (data ?? []) as QueueRow[];

  return (
    <>
      <h2 className="page-title">Verification queue</h2>
      {rows.length === 0 ? (
        <div className="empty">No businesses awaiting review. 🎉</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Category</th>
              <th>Location</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{CATEGORY_LABELS[b.category]}</td>
                <td>{[b.city, b.country].filter(Boolean).join(', ') || '—'}</td>
                <td>
                  <span className={`badge ${b.verification_status}`}>
                    {b.verification_status}
                  </span>
                </td>
                <td>{new Date(b.created_at).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <form action={reviewBusiness}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <input type="hidden" name="decision" value="verified" />
                    <button type="submit">Approve</button>
                  </form>
                  <form action={reviewBusiness}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button type="submit" className="danger">
                      Reject
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
