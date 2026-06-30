import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser/anon client factory. Subject to RLS — safe to use with the anon key.
 * Each app wraps this with its framework-specific session handling
 * (e.g. @supabase/ssr in Next.js).
 */
export function createAnonClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

/**
 * Server-only service-role client. BYPASSES RLS — never expose to the browser
 * and never instantiate with a key that reaches client bundles. Use exclusively
 * in server routes / webhooks / cron.
 */
export function createServiceClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
