'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error: signInError } = await supabase.auth.signInWithPassword(data);

  if (signInError) {
    return { error: signInError.message };
  }

  // Check if user has a tenant membership
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: memberships, error: membershipError } = await supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1);

    if (membershipError) {
      console.error('Error checking tenant membership:', membershipError);
      return { error: 'Failed to verify account setup.' };
    }

    // If no membership exists, redirect to complete setup
    if (!memberships || memberships.length === 0) {
      redirect('/register/complete-setup');
    }
  }

  redirect('/app');
}
