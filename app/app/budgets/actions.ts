"use server";

import { revalidatePath } from "next/cache";
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

// ---------------------------------------------------------------------------
// OHHFIN-102 — Copy Budget
// ---------------------------------------------------------------------------

export async function getLatestBudgetMonth(
  targetUserId: string
): Promise<{ monthStart: string; monthLabel: string } | null> {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  // Find most recent months with at least one budget line > 0 (look back up to 12 months)
  const { data } = await supabase
    .from("budgets")
    .select(`
      month_start,
      budget_lines (amount)
    `)
    .eq("tenant_id", membership.tenant_id)
    .eq("user_id", targetUserId)
    .order("month_start", { ascending: false })
    .limit(12);

  if (!data) return null;

  // Find the most recent month that has at least one line with amount > 0
  const latestWithBudget = data.find((b) =>
    b.budget_lines.some((line: { amount: number }) => Number(line.amount) > 0)
  );

  if (!latestWithBudget) return null;

  const date = new Date(latestWithBudget.month_start);
  const monthLabel = date.toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return { monthStart: latestWithBudget.month_start, monthLabel };
}

export async function copyBudgetFromMonth(
  sourceMonthStart: string,
  targetMonthStart: string,
  targetUserId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();
  const tenantId = membership.tenant_id;

  // 1. Get source budget lines with amount > 0
  const { data: sourceBudget } = await supabase
    .from("budgets")
    .select("id, budget_lines (category_id, amount)")
    .eq("tenant_id", tenantId)
    .eq("user_id", targetUserId)
    .eq("month_start", sourceMonthStart)
    .single();

  if (!sourceBudget) return { error: "Source budget not found." };

  const linesToCopy = sourceBudget.budget_lines.filter(
    (l: { amount: number }) => Number(l.amount) > 0
  );

  if (!linesToCopy.length) return { error: "No budget lines to copy." };

  // 2. Verify categories still exist and are active
  const categoryIds = linesToCopy.map((l: { category_id: string }) => l.category_id);
  const { data: activeCategories } = await supabase
    .from("categories")
    .select("id")
    .in("id", categoryIds)
    .eq("is_active", true);

  const activeCategoryIds = new Set((activeCategories ?? []).map((c) => c.id));

  const validLines = linesToCopy.filter((l: { category_id: string }) =>
    activeCategoryIds.has(l.category_id)
  );

  // 3. Upsert target budget row
  const { data: targetBudget, error: budgetError } = await supabase
    .from("budgets")
    .upsert(
      { tenant_id: tenantId, user_id: targetUserId, month_start: targetMonthStart },
      { onConflict: "tenant_id,user_id,month_start" }
    )
    .select("id")
    .single();

  if (budgetError || !targetBudget) {
    return { error: budgetError?.message ?? "Failed to create target budget." };
  }

  // 4. Upsert budget lines (overwrite existing amounts for matching categories)
  const lines = validLines.map((l: { category_id: string; amount: number }) => ({
    tenant_id: tenantId,
    budget_id: targetBudget.id,
    category_id: l.category_id,
    amount: l.amount,
  }));

  const { error: linesError } = await supabase
    .from("budget_lines")
    .upsert(lines, { onConflict: "tenant_id,budget_id,category_id" });

  if (linesError) return { error: linesError.message };

  revalidatePath("/app/budgets");
  return { success: true };
}
