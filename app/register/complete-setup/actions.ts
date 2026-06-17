'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function completeSetupAction(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const supabase = await createClient();

  const alias = formData.get('alias') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const userId = formData.get('userId') as string;

  if (!alias || !userId || !firstName || !lastName) {
    return { error: 'All fields are required.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: 'Authentication error.' };
  }

  const admin = createAdminClient();

  const { data: tenantData, error: tenantError } = await admin
    .from('tenants')
    .insert({ alias })
    .select('id')
    .single();

  if (tenantError || !tenantData) {
    if (tenantError?.code === '23505') {
      return { error: 'This household name is already taken. Please choose another.' };
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
    await admin.from('tenants').delete().eq('id', tenantData.id);
    return { error: `Failed to complete setup: ${membershipError.message}` };
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
  });

  if (profileError) {
    return { error: `Failed to save profile: ${profileError.message}` };
  }

  redirect('/app');
}
