'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership';
import { revalidatePath } from 'next/cache';

export async function createImportBatch(originalFilename: string) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('import_batches')
    .insert({
      tenant_id: membership.tenant_id,
      original_filename: originalFilename,
      imported_by_user_id: user.user.id,
      status: 'created'
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Failed to create import batch:', error);
    throw new Error('Failed to create import batch');
  }

  return data.id;
}

export async function insertStagingTransactions(
  batchId: string,
  rows: Array<{
    occurred_at: string;
    description: string;
    amount: number;
    transaction_type: 'income' | 'expense';
  }>
) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase.from('import_staging').insert(
    rows.map((row) => ({
      tenant_id: membership.tenant_id,
      import_batch_id: batchId,
      occurred_at: row.occurred_at,
      description: row.description,
      amount: row.amount,
      transaction_type: row.transaction_type,
      category_id: null
    }))
  );

  if (error) {
    console.error('Failed to insert staging transactions:', error);
    throw new Error('Failed to insert staging transactions');
  }

  const { error: updateError } = await supabase
    .from('import_batches')
    .update({ status: 'stored_pending' })
    .eq('id', batchId)
    .eq('tenant_id', membership.tenant_id);

  if (updateError) {
    console.error('Failed to update batch status:', updateError);
  }
}

export async function getStagingTransactions(batchId: string) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('import_staging')
    .select(`
      id,
      occurred_at,
      description,
      amount,
      transaction_type,
      category_id,
      categories(id, name, tag)
    `)
    .eq('tenant_id', membership.tenant_id)
    .eq('import_batch_id', batchId)
    .order('occurred_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch staging transactions:', error);
    throw new Error('Failed to fetch staging transactions');
  }

  return data || [];
}

export async function updateStagingCategory(
  stagingId: string,
  categoryId: string | null
) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('import_staging')
    .update({ category_id: categoryId })
    .eq('id', stagingId)
    .eq('tenant_id', membership.tenant_id);

  if (error) {
    console.error('Failed to update staging category:', error);
    throw new Error('Failed to update staging category');
  }

  revalidatePath('/app/import');
}

export async function postStagingTransactions(batchId: string) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Unauthorized');
  }

  const { data: stagingRows, error: fetchError } = await supabase
    .from('import_staging')
    .select('*')
    .eq('tenant_id', membership.tenant_id)
    .eq('import_batch_id', batchId);

  if (fetchError || !stagingRows) {
    console.error('Failed to fetch staging rows:', fetchError);
    throw new Error('Failed to fetch staging rows');
  }

  if (stagingRows.length > 0) {
    const { error: insertError } = await supabase.from('transactions').insert(
      stagingRows.map((row) => ({
        tenant_id: membership.tenant_id,
        transaction_date: row.occurred_at,
        description: row.description,
        amount: row.amount,
        transaction_type: row.transaction_type,
        category_id: row.category_id,
        account_id: null,
        created_by_user_id: user.user.id
      }))
    );

    if (insertError) {
      console.error('Failed to post transactions:', insertError);
      throw new Error('Failed to post transactions');
    }
  }

  const { error: deleteError } = await supabase
    .from('import_staging')
    .delete()
    .eq('tenant_id', membership.tenant_id)
    .eq('import_batch_id', batchId);

  if (deleteError) {
    console.error('Failed to delete staging rows:', deleteError);
  }

  const { error: updateError } = await supabase
    .from('import_batches')
    .update({ status: 'completed' })
    .eq('id', batchId)
    .eq('tenant_id', membership.tenant_id);

  if (updateError) {
    console.error('Failed to update batch status:', updateError);
  }

  revalidatePath('/app/import');
  revalidatePath('/app/transactions');
  revalidatePath('/app/dashboard');
}
