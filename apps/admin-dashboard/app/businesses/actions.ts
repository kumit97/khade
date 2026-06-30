'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase/server';
import type { VerificationStatus } from '@khade/shared';

/**
 * Approve or reject a business in the verification queue. Writes the status
 * change AND an admin_audit_log entry (security requirement: audit all admin
 * actions). Service-role client is used only after requireAdmin() confirms the
 * caller is an admin.
 */
export async function reviewBusiness(formData: FormData) {
  const { profile } = await requireAdmin();

  const businessId = String(formData.get('businessId'));
  const decision = String(formData.get('decision')) as 'verified' | 'rejected';
  if (!businessId || !['verified', 'rejected'].includes(decision)) {
    throw new Error('Invalid review input');
  }

  const db = createAdminSupabase();

  const { data: before } = await db
    .from('businesses')
    .select('id, verification_status')
    .eq('id', businessId)
    .single();

  const nextStatus: VerificationStatus = decision;
  const { error } = await db
    .from('businesses')
    .update({ verification_status: nextStatus })
    .eq('id', businessId);
  if (error) throw error;

  await db.from('admin_audit_log').insert({
    admin_id: profile.id,
    action: decision === 'verified' ? 'business.verify' : 'business.reject',
    entity_type: 'business',
    entity_id: businessId,
    before: before ?? null,
    after: { verification_status: nextStatus },
  });

  revalidatePath('/businesses');
}
