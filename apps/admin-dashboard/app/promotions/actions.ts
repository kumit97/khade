'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';
import { PROMO_TYPES, type PromoType } from '@khade/shared';

export async function createPromo(formData: FormData) {
  const { profile } = await requireAdmin();

  const code = String(formData.get('code')).trim().toUpperCase();
  const type = String(formData.get('type')) as PromoType;
  const value = Number(formData.get('value'));

  if (!code || !PROMO_TYPES.includes(type) || !Number.isFinite(value) || value < 0) {
    throw new Error('Invalid promo input');
  }

  const db = createAdminSupabase();
  const { error } = await db.from('promo_codes').insert({
    code,
    type,
    value,
    business_id: null, // platform-wide
    created_by: profile.id,
    is_active: true,
  });
  if (error) throw error;

  await db.from('admin_audit_log').insert({
    admin_id: profile.id,
    action: 'promo.create',
    entity_type: 'promo_code',
    after: { code, type, value },
  });

  revalidatePath('/promotions');
}
