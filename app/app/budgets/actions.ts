"use server";

import { createClient } from "@/lib/supabase/server";
import { getMonthStart } from "@/lib/db/month";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import { budgetSchema } from "@/lib/validation/budget";

export type BudgetLineView = {
  category_id: string;
  amount: number;
};

export async function getBudgetForMonth(
  month: string,
  activeMemberId?: string
): Promise<BudgetLineView[]> {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  // Use activeMemberId when provided (admin viewing another member's budget),
  // otherwise fall back to the logged-in user's own budget.
  const targetUserId = activeMemberId ?? user.id;

  const monthStart = getMonthStart(month);

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .select("id")
    .eq("tenant_id", membership.tenant_id)
    .eq("user_id", targetUserId)
    .eq("month_start", monthStart)
    .maybeSingle();

  if (budgetError) {
    throw new Error(`Failed to load budget: ${budgetError.message}`);
  }

  if (!budget) {
    return [];
  }

  const { data: lines, error: linesError } = await supabase
    .from("budget_lines")
    .select("category_id, amount")
    .eq("tenant_id", membership.tenant_id)
    .eq("budget_id", budget.id);

  if (linesError) {
    throw new Error(`Failed to load budget lines: ${linesError.message}`);
  }

  return (lines ?? []).map((line) => ({
    category_id: line.category_id,
    amount: Number(line.amount ?? 0),
  }));
}

export async function upsertBudget(input: unknown) {
  const parsed = budgetSchema.parse(input);

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const monthStart = getMonthStart(parsed.month);

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .upsert(
      {
        tenant_id: membership.tenant_id,
        user_id: user.id,
        month_start: monthStart,
      },
      {
        onConflict: "tenant_id,user_id,month_start",
      }
    )
    .select("id")
    .single();

  if (budgetError || !budget) {
    throw new Error(
      `Failed to create or load budget: ${budgetError?.message ?? "unknown error"}`
    );
  }

  const lines = parsed.lines.map((line) => ({
    tenant_id: membership.tenant_id,
    budget_id: budget.id,
    category_id: line.category_id,
    amount: line.amount,
  }));

  const { error: linesError } = await supabase
    .from("budget_lines")
    .upsert(lines, {
      onConflict: "tenant_id,budget_id,category_id",
    });

  if (linesError) {
    throw new Error(`Failed to save budget lines: ${linesError.message}`);
  }

  return { success: true };
}
