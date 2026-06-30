'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';

export async function suspendUser(formData: FormData) {
  const { profile } = await requireAdmin();
  const userId = String(formData.get('userId'));
  const suspend = String(formData.get('suspend')) === 'true';

  const db = createAdminSupabase();
  const { error } = await db
    .from('users')
    .update({ is_suspended: suspend })
    .eq('id', userId);
  if (error) throw error;

  await db.from('admin_audit_log').insert({
    admin_id: profile.id,
    action: suspend ? 'user.suspend' : 'user.reinstate',
    entity_type: 'user',
    entity_id: userId,
    after: { is_suspended: suspend },
  });

  revalidatePath('/users');
}
