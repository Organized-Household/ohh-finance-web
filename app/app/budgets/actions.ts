'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentMonthStart } from '@/lib/db/month';

const budgetLineSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number(),
});

const upsertBudgetSchema = z.object({
  month_start: z.string().regex(/^\d{4}-\d{2}-01$/),
  lines: z.array(budgetLineSchema),
  confirmedHistoricalEdit: z.boolean().optional(),
});

export async function upsertBudget(input: unknown) {
  const supabase = createClient();
  const membership = await getCurrentTenantMembership();

  if (!membership) {
    return { ok: false, error: 'Unauthorized' };
  }

  const parsed = upsertBudgetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', details: parsed.error.flatten() };
  }

  const { month_start, lines, confirmedHistoricalEdit } = parsed.data;
  const tenant_id = membership.tenant_id;

  // Historical budget guard
  const currentMonthStart = getCurrentMonthStart();
  const requestedMonth = new Date(month_start + 'T00:00:00.000Z');
  const currentMonth = new Date(currentMonthStart + 'T00:00:00.000Z');

  if (requestedMonth < currentMonth && !confirmedHistoricalEdit) {
    return {
      ok: false,
      error: 'This budget is from a past month. Set confirmedHistoricalEdit to confirm you intend to edit historical data.',
    };
  }

  // Check if budget exists
  const { data: existingBudget, error: fetchError } = await supabase
    .from('budgets')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('month_start', month_start)
    .maybeSingle();

  if (fetchError) {
    console.error('[upsertBudget] fetch error:', fetchError);
    return { ok: false, error: 'Database error' };
  }

  let budgetId: string;

  if (existingBudget) {
    budgetId = existingBudget.id;
  } else {
    // Create budget
    const { data: newBudget, error: insertError } = await supabase
      .from('budgets')
      .insert({ tenant_id, month_start })
      .select('id')
      .single();

    if (insertError || !newBudget) {
      console.error('[upsertBudget] insert budget error:', insertError);
      return { ok: false, error: 'Failed to create budget' };
    }

    budgetId = newBudget.id;
  }

  // Delete existing budget_lines
  const { error: deleteError } = await supabase
    .from('budget_lines')
    .delete()
    .eq('tenant_id', tenant_id)
    .eq('budget_id', budgetId);

  if (deleteError) {
    console.error('[upsertBudget] delete lines error:', deleteError);
    return { ok: false, error: 'Failed to delete existing budget lines' };
  }

  // Insert new budget_lines
  if (lines.length > 0) {
    const linesToInsert = lines.map((line) => ({
      tenant_id,
      budget_id: budgetId,
      category_id: line.category_id,
      amount: line.amount,
    }));

    const { error: insertLinesError } = await supabase
      .from('budget_lines')
      .insert(linesToInsert);

    if (insertLinesError) {
      console.error('[upsertBudget] insert lines error:', insertLinesError);
      return { ok: false, error: 'Failed to insert budget lines' };
    }
  }

  revalidatePath('/app/budgets');
  revalidatePath('/app/dashboard');

  return { ok: true, budgetId };
}

export async function getBudgetForMonth(monthStart: string) {
  const supabase = createClient();
  const membership = await getCurrentTenantMembership();

  if (!membership) {
    return { ok: false, error: 'Unauthorized' };
  }

  const tenant_id = membership.tenant_id;

  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('id, month_start')
    .eq('tenant_id', tenant_id)
    .eq('month_start', monthStart)
    .maybeSingle();

  if (budgetError) {
    console.error('[getBudgetForMonth] error:', budgetError);
    return { ok: false, error: 'Database error' };
  }

  if (!budget) {
    return { ok: true, data: { budget: null, lines: [] } };
  }

  const { data: lines, error: linesError } = await supabase
    .from('budget_lines')
    .select('id, category_id, amount')
    .eq('tenant_id', tenant_id)
    .eq('budget_id', budget.id);

  if (linesError) {
    console.error('[getBudgetForMonth] lines error:', linesError);
    return { ok: false, error: 'Database error' };
  }

  return { ok: true, data: { budget, lines: lines || [] } };
}
