// POST /functions/v1/paystack-initialize
// Body: { booking_id: string, callback_url?: string }
// Auth: requires the customer's Supabase JWT (Authorization: Bearer <token>).
// Creates a pending payment row and starts a Paystack transaction, returning
// the checkout URL the client opens. The Paystack secret never leaves the edge.
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/settle.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'unauthorized' }, 401);

    // Resolve the caller from their JWT.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const { booking_id, callback_url } = await req.json();
    if (!booking_id) return json({ error: 'booking_id_required' }, 400);

    const db = serviceClient();

    // Load the booking and confirm it belongs to the caller and is payable.
    const { data: booking } = await db
      .from('bookings')
      .select('id, customer_id, price, discount_amount, currency, payment_status, status')
      .eq('id', booking_id)
      .single();

    if (!booking || booking.customer_id !== user.id) {
      return json({ error: 'booking_not_found' }, 404);
    }
    if (booking.payment_status === 'paid') {
      return json({ error: 'already_paid' }, 409);
    }
    if (['cancelled', 'rejected', 'no_show'].includes(booking.status)) {
      return json({ error: 'booking_not_payable' }, 409);
    }

    const net = Number(booking.price) - Number(booking.discount_amount ?? 0);
    const amountMinor = Math.round(net * 100); // kobo
    if (amountMinor <= 0) return json({ error: 'invalid_amount' }, 400);

    const reference = `khade-${crypto.randomUUID()}`;

    // Record the pending payment (idempotent reference via unique index).
    const { error: payErr } = await db.from('payments').insert({
      booking_id: booking.id,
      customer_id: user.id,
      amount: net,
      currency: booking.currency ?? 'NGN',
      method: 'card',
      status: 'unpaid',
      gateway: 'paystack',
      gateway_reference: reference,
    });
    if (payErr) return json({ error: 'payment_create_failed', detail: payErr.message }, 500);

    // Start the Paystack transaction.
    const resp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountMinor,
        currency: booking.currency ?? 'NGN',
        reference,
        callback_url,
        metadata: { booking_id: booking.id, customer_id: user.id },
      }),
    });
    const result = await resp.json();
    if (!result?.status) {
      return json({ error: 'paystack_init_failed', detail: result?.message }, 502);
    }

    return json({
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference,
      amount: amountMinor,
      currency: booking.currency ?? 'NGN',
    });
  } catch (e) {
    return json({ error: 'unexpected', detail: String(e) }, 500);
  }
});
