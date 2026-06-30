'use server';

import { revalidatePath } from 'next/cache';
import { requireBusiness } from '@/lib/auth';

export async function createService(formData: FormData) {
  const { supabase, business } = await requireBusiness();

  const name = String(formData.get('name')).trim();
  const price = Number(formData.get('price'));
  const duration = Number(formData.get('duration_minutes'));

  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(duration) || duration <= 0) {
    throw new Error('Invalid service input');
  }

  const { error } = await supabase.from('services').insert({
    business_id: business.id,
    name,
    description: (formData.get('description') as string) || null,
    price,
    duration_minutes: duration,
  });
  if (error) throw error;
  revalidatePath('/services');
}

export async function toggleService(formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const id = String(formData.get('id'));
  const isActive = String(formData.get('is_active')) === 'true';
  const { error } = await supabase
    .from('services')
    .update({ is_active: !isActive })
    .eq('id', id)
    .eq('business_id', business.id);
  if (error) throw error;
  revalidatePath('/services');
}

export async function deleteService(formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const id = String(formData.get('id'));
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('business_id', business.id);
  if (error) throw error;
  revalidatePath('/services');
}
