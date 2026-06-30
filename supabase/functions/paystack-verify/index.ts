// POST /functions/v1/paystack-verify
// Body: { reference: string }
// Auth: customer JWT. Client-side fallback used right after the checkout
// redirect, in case the async webhook hasn't landed yet. Idempotent with the
// webhook (both call settleSuccessfulCharge, guarded by payment status).
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { serviceClient, settleSuccessfulCharge, getPaystackSecret } from '../_shared/settle.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'unauthorized' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const { reference } = await req.json();
    if (!reference) return json({ error: 'reference_required' }, 400);

    const db = serviceClient();
    const paystackSecret = await getPaystackSecret(db);

    // Ask Paystack for the authoritative transaction status.
    const resp = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } },
    );
    const result = await resp.json();
    if (!result?.status) {
      return json({ error: 'verify_failed', detail: result?.message }, 502);
    }

    const data = result.data;
    if (data?.status !== 'success') {
      return json({ status: data?.status ?? 'pending', reference });
    }

    const settle = await settleSuccessfulCharge(db, data);
    return json({ status: 'success', settle, reference });
  } catch (e) {
    return json({ error: 'unexpected', detail: String(e) }, 500);
  }
});
