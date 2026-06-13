import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CompleteSetupForm } from './complete-setup-form';

export default async function CompleteSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user already has membership (shouldn't be here)
  const { data: memberships } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect('/app');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Setup</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your account was created but setup did not complete. Click below to finish setting up your household.
          </p>
        </div>
        <CompleteSetupForm userId={user.id} />
      </div>
    </div>
  );
}
