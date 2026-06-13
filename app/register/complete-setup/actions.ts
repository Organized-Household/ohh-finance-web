'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function completeSetupAction(formData: FormData) {
  const supabase = await createClient();

  const alias = formData.get('alias') as string;
  const userId = formData.get('userId') as string;

  if (!alias || !userId) {
    return { error: 'Missing required fields.' };
  }

  // Verify user is authenticated and matches the userId
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: 'Authentication error.' };
  }

  // Service role required: initial tenants + tenant_members INSERT at registration.
  // RLS policies block writes before membership exists (chicken-egg problem).
  const admin = createAdminClient();

  const { data: tenantData, error: tenantError } = await admin
    .from('tenants')
    .insert({ alias })
    .select('id')
    .single();

  if (tenantError || !tenantData) {
    if (tenantError?.code === '23505') {
      return { error: 'This household alias is already taken. Please choose another.' };
    }
    return {
      error: `Failed to complete setup: ${tenantError?.message ?? 'tenant not created'}`,
    };
  }

  const { error: membershipError } = await admin.from('tenant_members').insert({
    tenant_id: tenantData.id,
    user_id: userId,
    role: 'admin',
  });

  if (membershipError) {
    // Roll back tenant if membership insert fails
    const { error: cleanupError } = await admin
      .from('tenants')
      .delete()
      .eq('id', tenantData.id);

    if (cleanupError) {
      console.error('Failed to roll back tenant after membership insert error', {
        tenantId: tenantData.id,
        cleanupError: cleanupError.message,
        membershipError: membershipError.message,
      });
    }

    return {
      error: `Failed to complete setup: ${membershipError.message}`,
    };
  }

  redirect('/app');
}
