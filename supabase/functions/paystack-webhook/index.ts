// POST /functions/v1/paystack-webhook  (configure this URL in Paystack dashboard)
// No JWT (verify_jwt = false in config.toml). Authenticity is proven by the
// HMAC-SHA512 signature in the x-paystack-signature header.
//
// deno-lint-ignore-file no-explicit-any
import { json } from '../_shared/cors.ts';
import { serviceClient, settleSuccessfulCharge } from '../_shared/settle.ts';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const secret = Deno.env.get('PAYSTACK_SECRET_KEY')!;
  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature') ?? '';

  // Verify the payload signature (HMAC-SHA512 of the raw body with the secret).
  const expected = createHmac('sha512', secret).update(raw).digest('hex');
  if (signature !== expected) {
    return json({ error: 'invalid_signature' }, 401);
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'bad_payload' }, 400);
  }

  // Only successful charges settle a booking. Acknowledge everything else 200
  // so Paystack does not retry.
  if (event?.event === 'charge.success') {
    const db = serviceClient();
    const result = await settleSuccessfulCharge(db, event.data);
    return json({ received: true, result });
  }

  return json({ received: true, ignored: event?.event ?? 'unknown' });
});
