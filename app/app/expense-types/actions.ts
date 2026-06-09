import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership';
import { revalidatePath } from 'next/cache';

export async function createExpenseType(
  name: string,
  slug: string,
  description?: string
) {
  const membership = await getCurrentTenantMembership();

  if (!membership || membership.role !== 'admin') {
    return { error: 'Admin permission required' };
  }

  // Service role required: expense_types table has no write RLS for authenticated role.
  // Only service role can INSERT/UPDATE/DELETE expense_types.
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('expense_types')
    .insert({ name, slug, description })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/expense-types');
  return { success: true, data };
}

export async function updateExpenseType(
  id: string,
  name: string,
  slug: string,
  description?: string
) {
  const membership = await getCurrentTenantMembership();

  if (!membership || membership.role !== 'admin') {
    return { error: 'Admin permission required' };
  }

  // Service role required: expense_types table has no write RLS for authenticated role.
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('expense_types')
    .update({ name, slug, description })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/expense-types');
  return { success: true, data };
}

export async function deleteExpenseType(id: string) {
  const membership = await getCurrentTenantMembership();

  if (!membership || membership.role !== 'admin') {
    return { error: 'Admin permission required' };
  }

  // Service role required: expense_types table has no write RLS for authenticated role.
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('expense_types')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/expense-types');
  return { success: true };
}
