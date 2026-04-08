"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership"
import { budgetSchema } from "@/lib/validation/budget"
import { getMonthStart } from "@/lib/db/month"

export async function getBudgetForMonth(month: string) {
  const supabase = await createClient()

  const membership = await getCurrentTenantMembership()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Authenticated user not found")
  }

  const monthStart = getMonthStart(month)

  const { data: budget, error } = await supabase
    .from("budgets")
    .select(`
      id,
      month_start,
      budget_lines (
        id,
        category_id,
        planned_income,
        planned_expense
      )
    `)
    .eq("tenant_id", membership.tenant_id)
    .eq("user_id", user.id)
    .eq("month_start", monthStart)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load budget: ${error.message}`)
  }

  return budget
}

export async function upsertBudget(input: unknown) {
  const parsed = budgetSchema.parse(input)

  const supabase = await createClient()

  const membership = await getCurrentTenantMembership()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Authenticated user not found")
  }

  const monthStart = getMonthStart(parsed.month)

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
    .single()

  if (budgetError || !budget) {
    throw new Error(
      `Failed to create or load budget: ${budgetError?.message ?? "unknown error"}`
    )
  }

  const lines = parsed.lines.map((line) => ({
    tenant_id: membership.tenant_id,
    budget_id: budget.id,
    category_id: line.category_id,
    planned_income: line.planned_income,
    planned_expense: line.planned_expense,
  }))

  const { error: linesError } = await supabase
    .from("budget_lines")
    .upsert(lines, {
      onConflict: "tenant_id,budget_id,category_id",
    })

  if (linesError) {
    throw new Error(`Failed to save budget lines: ${linesError.message}`)
  }

  return { success: true }
}