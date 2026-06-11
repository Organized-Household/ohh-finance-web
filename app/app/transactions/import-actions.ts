'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership';
import { normalizeTransactionRows } from '@/lib/import/normalize-transaction-rows';
import { calculateFileHash } from '@/lib/import/import-lock';
import { acquireImportLock, releaseImportLock } from '@/lib/import/import-lock';
import { applyCategorizationRules } from '@/lib/import/apply-categorization-rules';

export async function uploadImport(formData: FormData) {
  const supabase = createClient();
  const membership = await getCurrentTenantMembership(supabase);
  if (!membership) {
    return { success: false, error: 'Not authenticated or no tenant membership' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileHash = calculateFileHash(buffer);

  const adminClient = createAdminClient();
  const lockAcquired = await acquireImportLock(adminClient, membership.tenant_id);
  if (!lockAcquired) {
    return { success: false, error: 'Another import is in progress for this tenant' };
  }

  try {
    const { data: duplicateCheck, error: dupError } = await adminClient.rpc(
      'check_duplicate_import',
      {
        p_tenant_id: membership.tenant_id,
        p_filename: file.name,
        p_file_hash: fileHash
      }
    );

    if (dupError) {
      return { success: false, error: 'Failed to check for duplicates' };
    }

    if (duplicateCheck && duplicateCheck.length > 0) {
      const existing = duplicateCheck[0];
      return {
        success: false,
        error: `Duplicate import detected: ${existing.original_filename} (${existing.status}) from ${new Date(existing.created_at).toLocaleString()}`
      };
    }

    const text = buffer.toString('utf-8');
    const normalizedRows = normalizeTransactionRows(text);

    if (normalizedRows.length === 0) {
      return { success: false, error: 'No valid transactions found in CSV' };
    }

    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        tenant_id: membership.tenant_id,
        original_filename: file.name,
        file_hash: fileHash,
        status: 'pending',
        imported_by: membership.user_id
      })
      .select('id')
      .single();

    if (batchError || !batch) {
      return { success: false, error: 'Failed to create import batch' };
    }

    const stagingRows = normalizedRows.map((row) => ({
      tenant_id: membership.tenant_id,
      import_batch_id: batch.id,
      occurred_at: row.date,
      description: row.description,
      amount: row.amount,
      transaction_type: row.transaction_type,
      category_id: null
    }));

    const { error: insertError } = await supabase
      .from('import_staging')
      .insert(stagingRows);

    if (insertError) {
      return { success: false, error: 'Failed to insert staging rows' };
    }

    await applyCategorizationRules(supabase, membership.tenant_id, batch.id);

    revalidatePath('/app/transactions/import');
    return { success: true, batchId: batch.id };
  } finally {
    await releaseImportLock(adminClient, membership.tenant_id);
  }
}

export async function postStagingRows(batchId: string, rowIds: string[]) {
  const supabase = createClient();
  const membership = await getCurrentTenantMembership(supabase);
  if (!membership) {
    return { success: false, error: 'Not authenticated or no tenant membership' };
  }

  const { data: stagingRows, error: fetchError } = await supabase
    .from('import_staging')
    .select('*')
    .eq('import_batch_id', batchId)
    .in('id', rowIds);

  if (fetchError || !stagingRows) {
    console.error(`[import] post failed — batchId: ${batchId}, rowCount: ${rowIds.length}, error: ${fetchError?.message || 'Failed to fetch staging rows'}`);
    return { success: false, error: 'Failed to fetch staging rows' };
  }

  const transactions = stagingRows.map((row) => ({
    tenant_id: membership.tenant_id,
    transaction_date: row.occurred_at,
    description: row.description,
    amount: row.amount,
    transaction_type: row.transaction_type,
    category_id: row.category_id,
    created_by_user_id: membership.user_id
  }));

  const { error: insertError } = await supabase
    .from('transactions')
    .insert(transactions);

  if (insertError) {
    console.error(`[import] post failed — batchId: ${batchId}, rowCount: ${stagingRows.length}, error: ${insertError.message}`);
    return { success: false, error: 'Failed to insert transactions' };
  }

  const { error: deleteError } = await supabase
    .from('import_staging')
    .delete()
    .in('id', rowIds);

  if (deleteError) {
    console.error(`[import] post failed — batchId: ${batchId}, rowCount: ${stagingRows.length}, error: ${deleteError.message}`);
    return { success: false, error: 'Failed to delete staging rows' };
  }

  const { count } = await supabase
    .from('import_staging')
    .select('id', { count: 'exact', head: true })
    .eq('import_batch_id', batchId);

  if (count === 0) {
    await supabase
      .from('import_batches')
      .update({ status: 'completed' })
      .eq('id', batchId);
  }

  revalidatePath('/app/transactions/import');
  revalidatePath('/app/transactions');
  return { success: true };
}

export async function updateStagingRowCategory(
  rowId: string,
  categoryId: string | null
) {
  const supabase = createClient();
  const membership = await getCurrentTenantMembership(supabase);
  if (!membership) {
    return { success: false, error: 'Not authenticated or no tenant membership' };
  }

  const { error } = await supabase
    .from('import_staging')
    .update({ category_id: categoryId })
    .eq('id', rowId)
    .eq('tenant_id', membership.tenant_id);

  if (error) {
    return { success: false, error: 'Failed to update category' };
  }

  revalidatePath('/app/transactions/import');
  return { success: true };
}

export async function deleteStagingRow(rowId: string) {
  const supabase = createClient();
  const membership = await getCurrentTenantMembership(supabase);
  if (!membership) {
    return { success: false, error: 'Not authenticated or no tenant membership' };
  }

  const { error } = await supabase
    .from('import_staging')
    .delete()
    .eq('id', rowId)
    .eq('tenant_id', membership.tenant_id);

  if (error) {
    return { success: false, error: 'Failed to delete staging row' };
  }

  revalidatePath('/app/transactions/import');
  return { success: true };
}

export async function discardImportBatch(batchId: string) {
  const supabase = createClient();
  const membership = await getCurrentTenantMembership(supabase);
  if (!membership) {
    return { success: false, error: 'Not authenticated or no tenant membership' };
  }

  const { error: deleteStaging } = await supabase
    .from('import_staging')
    .delete()
    .eq('import_batch_id', batchId)
    .eq('tenant_id', membership.tenant_id);

  if (deleteStaging) {
    return { success: false, error: 'Failed to delete staging rows' };
  }

  const { error: deleteBatch } = await supabase
    .from('import_batches')
    .delete()
    .eq('id', batchId)
    .eq('tenant_id', membership.tenant_id);

  if (deleteBatch) {
    return { success: false, error: 'Failed to delete import batch' };
  }

  revalidatePath('/app/transactions/import');
  return { success: true };
}
