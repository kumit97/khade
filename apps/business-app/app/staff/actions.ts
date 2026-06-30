'use server';

import { revalidatePath } from 'next/cache';
import { requireBusiness } from '@/lib/auth';

export async function addStaff(formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const displayName = String(formData.get('display_name')).trim();
  if (!displayName) throw new Error('Name required');

  const { error } = await supabase.from('business_staff').insert({
    business_id: business.id,
    display_name: displayName,
    title: (formData.get('title') as string) || null,
    // Default Mon–Fri 9–5; editable later.
    working_hours: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      start: '09:00',
      end: '17:00',
    })),
  });
  if (error) throw error;
  revalidatePath('/staff');
}
