import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CompleteSetupForm } from './complete-setup-form';

export default async function CompleteSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: memberships } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect('/app');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-sm border border-slate-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Welcome to OHh-Budget</h1>
          <p className="mt-2 text-sm text-slate-600">
            Let&apos;s finish setting up your household. This only takes a moment.
          </p>
        </div>
        <CompleteSetupForm userId={user.id} />
      </div>
    </div>
  );
}
