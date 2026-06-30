'use server';

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { BUSINESS_CATEGORIES, type BusinessCategory } from '@khade/shared';

export async function createBusiness(formData: FormData) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = String(formData.get('name')).trim();
  const category = String(formData.get('category')) as BusinessCategory;
  if (!name || !BUSINESS_CATEGORIES.includes(category)) {
    throw new Error('Invalid business input');
  }

  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 6);

  const { error } = await supabase.from('businesses').insert({
    owner_id: user.id,
    name,
    slug,
    category,
    description: (formData.get('description') as string) || null,
    city: (formData.get('city') as string) || null,
    country: (formData.get('country') as string) || null,
    verification_status: 'pending',
  });
  if (error) throw error;

  // Ensure the owner's profile role reflects business ownership.
  await supabase.from('users').update({ role: 'business_owner' }).eq('id', user.id);

  redirect('/');
}
