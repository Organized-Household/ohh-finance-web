'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function completeSetupAction(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

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

  try {
    // Call the tenant bootstrap RPC
    const { data, error: rpcError } = await adminClient.rpc(
      'create_tenant_and_membership',
      {
        p_alias: alias,
        p_user_id: userId,
      }
    );

    if (rpcError) {
      console.error('RPC error during setup completion:', rpcError);
      if (rpcError.message?.includes('duplicate') || rpcError.code === '23505') {
        return { error: 'This household alias is already taken. Please choose another.' };
      }
      return { error: 'Failed to complete setup. Please try again.' };
    }

    if (!data) {
      return { error: 'Setup completed but no tenant ID returned.' };
    }
  } catch (err: unknown) {
    console.error('Exception during setup completion:', err);
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  redirect('/app');
}
