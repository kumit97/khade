// Shared settlement logic used by both the Paystack webhook and the verify
// endpoint, so a successful charge is recorded identically and idempotently
// regardless of which path confirms it first.
//
// deno-lint-ignore-file no-explicit-any
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Resolve the Paystack secret key. Prefers the PAYSTACK_SECRET_KEY function
 * secret (set via `supabase secrets set`); falls back to Supabase Vault via the
 * service-role-only get_vault_secret() accessor. `db` must be a service client.
 */
export async function getPaystackSecret(db: SupabaseClient): Promise<string> {
  const envKey = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (envKey) return envKey;
  const { data, error } = await db.rpc('get_vault_secret', {
    p_name: 'PAYSTACK_SECRET_KEY',
  });
  if (error || !data) throw new Error('paystack_secret_unavailable');
  return data as string;
}

export interface SettleResult {
  status: 'paid' | 'already_paid' | 'amount_mismatch' | 'not_found' | 'ignored';
  bookingId?: string;
}

/**
 * Record a successful Paystack charge. `data` is the Paystack transaction
 * object (from webhook `data` or verify `data`). Amount is in the minor unit
 * (kobo). Idempotent: a payment already marked paid is a no-op.
 */
export async function settleSuccessfulCharge(
  db: SupabaseClient,
  data: any,
): Promise<SettleResult> {
  const reference: string | undefined = data?.reference;
  if (!reference) return { status: 'ignored' };

  const { data: payment } = await db
    .from('payments')
    .select('id, booking_id, customer_id, amount, status, currency')
    .eq('gateway_reference', reference)
    .maybeSingle();

  if (!payment) return { status: 'not_found' };
  if (payment.status === 'paid') {
    return { status: 'already_paid', bookingId: payment.booking_id };
  }

  // Defend against tampered/incorrect amounts: Paystack amount is in kobo.
  const expectedMinor = Math.round(Number(payment.amount) * 100);
  if (Number(data.amount) !== expectedMinor) {
    await db.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    await db.from('fraud_flags').insert({
      payment_id: payment.id,
      booking_id: payment.booking_id,
      user_id: payment.customer_id,
      reason: 'manual_review',
      details: { kind: 'amount_mismatch', expected: expectedMinor, got: data.amount },
    });
    return { status: 'amount_mismatch', bookingId: payment.booking_id };
  }

  // Mark the payment paid.
  await db
    .from('payments')
    .update({
      status: 'paid',
      gateway: 'paystack',
      receipt_url: data?.receipt_url ?? null,
    })
    .eq('id', payment.id);

  // Confirm the booking and flag it paid.
  await db
    .from('bookings')
    .update({ payment_status: 'paid', status: 'confirmed' })
    .eq('id', payment.booking_id)
    .in('status', ['pending', 'confirmed']);

  // Load booking for loyalty + notification context.
  const { data: booking } = await db
    .from('bookings')
    .select('id, business_id, customer_id, price, discount_amount')
    .eq('id', payment.booking_id)
    .single();

  if (booking) {
    const net = Number(booking.price) - Number(booking.discount_amount ?? 0);
    const points = Math.floor(net); // 1 point per major currency unit (MVP)
    if (points > 0) {
      await db.from('loyalty_transactions').insert({
        user_id: booking.customer_id,
        business_id: booking.business_id,
        booking_id: booking.id,
        points,
        reason: 'earned_booking',
      });
    }
    await db.from('notifications').insert({
      user_id: booking.customer_id,
      type: 'payment_receipt',
      title: 'Payment received',
      body: `Your payment of ${payment.currency} ${Number(payment.amount).toLocaleString()} was successful.`,
      data: { booking_id: booking.id, reference },
    });
  }

  return { status: 'paid', bookingId: payment.booking_id };
}
