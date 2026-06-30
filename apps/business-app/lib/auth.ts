import { redirect } from 'next/navigation';
import { createServerSupabase } from './supabase/server';

/**
 * Resolve the signed-in user and the business they own. MVP assumption: one
 * business per owner (see README → Assumptions). Staff support reads
 * business_staff; here we resolve the owned business for the dashboard.
 * RLS still enforces row access — this only picks the active business context.
 */
export async function requireBusiness() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!business) redirect('/onboarding');

  return { supabase, user, business };
}
