-- ============================================================================
-- KHADE 0009 — Vault secret accessor for edge functions
-- Lets the service role (used by edge functions) read a Vault secret by name.
-- Restricted to service_role only; anon/authenticated cannot call it.
-- ============================================================================

create or replace function public.get_vault_secret(p_name text)
returns text
language sql
security definer
set search_path = vault, public
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = p_name
  limit 1;
$$;

revoke execute on function public.get_vault_secret(text) from public, anon, authenticated;
grant execute on function public.get_vault_secret(text) to service_role;
