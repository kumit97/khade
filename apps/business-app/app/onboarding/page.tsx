import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { BUSINESS_CATEGORIES, CATEGORY_LABELS } from '@khade/shared';
import { createBusiness } from './actions';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // If they already have a business, go to the dashboard.
  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (existing) redirect('/');

  return (
    <div style={{ maxWidth: 480, margin: '8vh auto' }}>
      <h2 className="page-title">Set up your business</h2>
      <form action={createBusiness} className="form">
        <input name="name" placeholder="Business name" required />
        <select name="category" defaultValue="salon">
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <textarea name="description" placeholder="Describe your business" rows={3} />
        <div className="row">
          <input name="city" placeholder="City" />
          <input name="country" placeholder="Country" />
        </div>
        <button type="submit">Create &amp; submit for verification</button>
      </form>
      <p style={{ color: 'var(--muted)', marginTop: 12 }}>
        Your business starts as <strong>pending</strong> and becomes discoverable once an
        admin verifies it.
      </p>
    </div>
  );
}
