import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';
import { suspendUser } from './actions';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireAdmin();
  const db = createAdminSupabase();
  let query = db
    .from('users')
    .select('id, full_name, email, role, is_suspended, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (searchParams.q) {
    query = query.or(`full_name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);
  }
  const { data } = await query;
  const rows = data ?? [];

  return (
    <>
      <h2 className="page-title">Users</h2>
      <form method="get" style={{ maxWidth: 320 }}>
        <input name="q" placeholder="Search name or email…" defaultValue={searchParams.q ?? ''} />
      </form>
      {rows.length === 0 ? (
        <div className="empty">No users found.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name ?? '—'}</td>
                <td>{u.email ?? '—'}</td>
                <td>{u.role}</td>
                <td>
                  <span className={`badge ${u.is_suspended ? 'suspended' : 'verified'}`}>
                    {u.is_suspended ? 'suspended' : 'active'}
                  </span>
                </td>
                <td>
                  <form action={suspendUser}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="suspend" value={String(!u.is_suspended)} />
                    <button type="submit" className={u.is_suspended ? '' : 'danger'}>
                      {u.is_suspended ? 'Reinstate' : 'Suspend'}
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
