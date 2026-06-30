import { requireBusiness } from '@/lib/auth';
import { addStaff } from './actions';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const { supabase, business } = await requireBusiness();
  const { data } = await supabase
    .from('business_staff')
    .select('id, display_name, title, is_active')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true });
  const rows = data ?? [];

  return (
    <>
      <h2 className="page-title">Staff</h2>

      <form action={addStaff} className="form" style={{ marginBottom: 24 }}>
        <input name="display_name" placeholder="Staff name" required />
        <input name="title" placeholder="Title (e.g. Senior Stylist)" />
        <button type="submit">Add staff member</button>
      </form>

      {rows.length === 0 ? (
        <div className="empty">No staff yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.display_name}</td>
                <td>{s.title ?? '—'}</td>
                <td>
                  <span className={`badge ${s.is_active ? 'confirmed' : 'cancelled'}`}>
                    {s.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ color: 'var(--muted)', marginTop: 16 }}>
        Per-staff working hours and performance views are stored in
        <code> business_staff.working_hours</code>; the editor UI is a follow-up slice.
      </p>
    </>
  );
}
