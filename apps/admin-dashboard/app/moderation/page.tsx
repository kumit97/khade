import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  await requireAdmin();
  const db = createAdminSupabase();
  const { data } = await db
    .from('reviews')
    .select('id, rating, body, flagged_reason, created_at, businesses(name)')
    .eq('is_flagged', true)
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as any[];

  return (
    <>
      <h2 className="page-title">Content moderation — flagged reviews</h2>
      {rows.length === 0 ? (
        <div className="empty">Nothing flagged. The queue is clear.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.businesses?.name ?? '—'}</td>
                <td>{r.rating}★</td>
                <td>{r.body ?? '—'}</td>
                <td>{r.flagged_reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
