import { requireBusiness } from '@/lib/auth';
import { createService, toggleService, deleteService } from './actions';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const { supabase, business } = await requireBusiness();
  const { data } = await supabase
    .from('services')
    .select('id, name, price, currency, duration_minutes, is_active')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });
  const rows = data ?? [];

  return (
    <>
      <h2 className="page-title">Services</h2>

      <form action={createService} className="form" style={{ marginBottom: 24 }}>
        <input name="name" placeholder="Service name" required />
        <textarea name="description" placeholder="Description (optional)" rows={2} />
        <div className="row">
          <input name="price" type="number" step="0.01" min="0" placeholder="Price" required />
          <input
            name="duration_minutes"
            type="number"
            min="1"
            placeholder="Duration (min)"
            required
          />
        </div>
        <button type="submit">Add service</button>
      </form>

      {rows.length === 0 ? (
        <div className="empty">No services yet. Add your first above.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  {s.currency} {Number(s.price).toFixed(2)}
                </td>
                <td>{s.duration_minutes} min</td>
                <td>
                  <span className={`badge ${s.is_active ? 'confirmed' : 'cancelled'}`}>
                    {s.is_active ? 'active' : 'hidden'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <form action={toggleService}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="is_active" value={String(s.is_active)} />
                    <button type="submit" className="ghost">
                      {s.is_active ? 'Hide' : 'Show'}
                    </button>
                  </form>
                  <form action={deleteService}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="danger">
                      Delete
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
