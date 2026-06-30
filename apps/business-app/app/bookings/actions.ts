'use server';

import { revalidatePath } from 'next/cache';
import { requireBusiness } from '@/lib/auth';
import { canTransition, type BookingStatus } from '@khade/shared';

/**
 * Transition a booking's status (accept/decline/complete/no-show). RLS ensures
 * the caller can only update bookings for businesses they work for; we also
 * validate the transition is legal and notify the customer.
 */
export async function updateBookingStatus(formData: FormData) {
  const { supabase, business } = await requireBusiness();

  const bookingId = String(formData.get('bookingId'));
  const next = String(formData.get('next')) as BookingStatus;

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, customer_id, business_id')
    .eq('id', bookingId)
    .single();

  if (!booking || booking.business_id !== business.id) {
    throw new Error('Booking not found');
  }
  if (!canTransition(booking.status as BookingStatus, next)) {
    throw new Error(`Illegal transition ${booking.status} → ${next}`);
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: next })
    .eq('id', bookingId);
  if (error) throw error;

  // Notify the customer (push delivery handled by the FCM worker — see README).
  const typeMap: Partial<Record<BookingStatus, string>> = {
    confirmed: 'booking_confirmation',
    rejected: 'booking_cancelled',
    cancelled: 'booking_cancelled',
  };
  const notifType = typeMap[next];
  if (notifType) {
    await supabase.from('notifications').insert({
      user_id: booking.customer_id,
      type: notifType,
      title: `Your booking was ${next}`,
      body: `${business.name} ${next} your appointment.`,
      data: { booking_id: bookingId },
    });
  }

  revalidatePath('/bookings');
  revalidatePath('/');
}
