'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership';
import { revalidatePath } from 'next/cache';

export async function getBudget(monthStart: string) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('id, month_start')
    .eq('tenant_id', membership.tenant_id)
    .eq('month_start', monthStart)
    .single();

  if (budgetError && budgetError.code !== 'PGRST116') {
    console.error('Failed to fetch budget:', budgetError);
    throw new Error('Failed to fetch budget');
  }

  if (!budget) {
    return { budget: null, lines: [] };
  }

  const { data: lines, error: linesError } = await supabase
    .from('budget_lines')
    .select(`
      id,
      category_id,
      amount,
      categories(id, name, tag)
    `)
    .eq('tenant_id', membership.tenant_id)
    .eq('budget_id', budget.id);

  if (linesError) {
    console.error('Failed to fetch budget lines:', linesError);
    throw new Error('Failed to fetch budget lines');
  }

  return { budget, lines: lines || [] };
}

export async function upsertBudget(
  monthStart: string,
  lines: Array<{ category_id: string; amount: number }>
) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership(supabase);

  if (!membership) {
    throw new Error('Unauthorized');
  }

  let budgetId: string;

  const { data: existingBudget, error: fetchError } = await supabase
    .from('budgets')
    .select('id')
    .eq('tenant_id', membership.tenant_id)
    .eq('month_start', monthStart)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Failed to fetch budget:', fetchError);
    throw new Error('Failed to fetch budget');
  }

  if (existingBudget) {
    budgetId = existingBudget.id;
  } else {
    const { data: newBudget, error: createError } = await supabase
      .from('budgets')
      .insert({
        tenant_id: membership.tenant_id,
        month_start: monthStart
      })
      .select('id')
      .single();

    if (createError || !newBudget) {
      console.error('Failed to create budget:', createError);
      throw new Error('Failed to create budget');
    }

    budgetId = newBudget.id;
  }

  const { error: deleteError } = await supabase
    .from('budget_lines')
    .delete()
    .eq('tenant_id', membership.tenant_id)
    .eq('budget_id', budgetId);

  if (deleteError) {
    console.error('Failed to delete existing budget lines:', deleteError);
    throw new Error('Failed to delete existing budget lines');
  }

  if (lines.length > 0) {
    const { error: insertError } = await supabase.from('budget_lines').insert(
      lines.map((line) => ({
        tenant_id: membership.tenant_id,
        budget_id: budgetId,
        category_id: line.category_id,
        amount: line.amount
      }))
    );

    if (insertError) {
      console.error('Failed to insert budget lines:', insertError);
      throw new Error('Failed to insert budget lines');
    }
  }

  revalidatePath('/app/budgets');
  revalidatePath('/app/dashboard');
}
