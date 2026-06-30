import { requireBusiness } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const { supabase, business } = await requireBusiness();

  // Distinct customers who have booked this business, with booking counts.
  const { data } = await supabase
    .from('bookings')
    .select('customer_id, users(full_name, email)')
    .eq('business_id', business.id)
    .limit(500);

  const byCustomer = new Map<string, { name: string; email: string; count: number }>();
  for (const row of (data ?? []) as any[]) {
    const id = row.customer_id;
    const entry = byCustomer.get(id) ?? {
      name: row.users?.full_name ?? '—',
      email: row.users?.email ?? '—',
      count: 0,
    };
    entry.count += 1;
    byCustomer.set(id, entry);
  }
  const rows = [...byCustomer.values()].sort((a, b) => b.count - a.count);

  return (
    <>
      <h2 className="page-title">Customers</h2>
      {rows.length === 0 ? (
        <div className="empty">No customers yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Bookings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.email}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ color: 'var(--muted)', marginTop: 16 }}>
        Internal notes, loyalty tracking and promo blasts attach to these customers — see
        <code> loyalty_balances</code> and <code> promo_codes</code> (business-scoped).
      </p>
    </>
  );
}
