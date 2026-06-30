import { redirect } from 'next/navigation';
import { createServerSupabase } from './supabase/server';

/**
 * Server-side admin gate. Confirms there is a session AND that the user's
 * public.users.role is 'admin'. Role is enforced server-side, never trusted
 * from the client (per security requirements). Redirects otherwise.
 */
export async function requireAdmin() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/login?error=not_admin');
  }

  return { user, profile };
}
