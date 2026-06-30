import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** RLS-bound client tied to the signed-in admin's session (App Router). */
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options?: CookieOptions }[]) => {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // set() throws in Server Components; middleware refreshes the session.
        }
      },
    },
  });
}

/**
 * Service-role client. BYPASSES RLS — only call from server actions/route
 * handlers after verifying the caller is an admin via requireAdmin().
 */
export function createAdminSupabase() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
