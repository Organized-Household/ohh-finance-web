import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function registerTenant(formData: FormData) {
  const householdAlias = formData.get('householdAlias') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!householdAlias || !email || !password) {
    return { error: 'All fields are required' };
  }

  const supabase = createClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !authData.user) {
    return { error: signUpError?.message || 'Registration failed' };
  }

  // Service role required: Initial tenant + tenant_members INSERT at registration.
  // RLS policies block writes before membership exists (chicken-egg problem).
  const adminClient = createAdminClient();

  const { data: tenant, error: tenantError } = await adminClient
    .from('tenants')
    .insert({ alias: householdAlias })
    .select('id')
    .single();

  if (tenantError) {
    return { error: 'Household alias already taken or invalid' };
  }

  const { error: memberError } = await adminClient
    .from('tenant_members')
    .insert({
      tenant_id: tenant.id,
      user_id: authData.user.id,
      role: 'admin',
    });

  if (memberError) {
    return { error: 'Failed to create membership' };
  }

  redirect('/dashboard');
}
