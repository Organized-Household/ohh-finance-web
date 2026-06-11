'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership';
import { revalidatePath } from 'next/cache';

export async function getTransactions(monthStart: string) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      transaction_date,
      description,
      amount,
      transaction_type,
      category_id,
      created_by_user_id,
      created_at,
      updated_at,
      categories(id, name, tag)
    `)
    .eq('tenant_id', membership.tenant_id)
    .gte('transaction_date', monthStart)
    .lt('transaction_date', nextMonthStart.toISOString().split('T')[0])
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('Failed to fetch transactions:', error);
    throw new Error('Failed to fetch transactions');
  }

  return data;
}

export async function createTransaction(formData: {
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category_id: string;
  account_id?: string | null;
}) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase.from('transactions').insert({
    tenant_id: membership.tenant_id,
    transaction_date: formData.transaction_date,
    description: formData.description,
    amount: formData.amount,
    transaction_type: formData.transaction_type,
    category_id: formData.category_id,
    account_id: formData.account_id || null,
    created_by_user_id: user.user.id
  });

  if (error) {
    console.error('Failed to create transaction:', error);
    throw new Error('Failed to create transaction');
  }

  revalidatePath('/app/transactions');
  revalidatePath('/app/dashboard');
}

export async function updateTransaction(
  id: string,
  formData: {
    transaction_date: string;
    description: string;
    amount: number;
    transaction_type: 'income' | 'expense';
    category_id: string;
    account_id?: string | null;
  }
) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      transaction_date: formData.transaction_date,
      description: formData.description,
      amount: formData.amount,
      transaction_type: formData.transaction_type,
      category_id: formData.category_id,
      account_id: formData.account_id || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('tenant_id', membership.tenant_id);

  if (error) {
    console.error('Failed to update transaction:', error);
    throw new Error('Failed to update transaction');
  }

  revalidatePath('/app/transactions');
  revalidatePath('/app/dashboard');
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('tenant_id', membership.tenant_id);

  if (error) {
    console.error('Failed to delete transaction:', error);
    throw new Error('Failed to delete transaction');
  }

  revalidatePath('/app/transactions');
  revalidatePath('/app/dashboard');
}
