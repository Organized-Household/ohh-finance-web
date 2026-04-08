"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership"
import { budgetSchema } from "@/lib/validation/budget"
import { getMonthStart } from "@/lib/db/month"

export async function getBudgetForMonth(month: string) {
  const supabase = await createClient()

  const membership = await getCurrentTenantMembership()

  const monthStart = getMonthStart(month)

  const { data: budget } = await supabase
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
    .eq("user_id", membership.user_id)
    .eq("month_start", monthStart)
    .single()

  return budget
}

export async function upsertBudget(input: unknown) {
  const parsed = budgetSchema.parse(input)

  const supabase = await createClient()

  const membership = await getCurrentTenantMembership()

  const monthStart = getMonthStart(parsed.month)

  // ensure budget row exists
  const { data: budget } = await supabase
    .from("budgets")
    .upsert(
      {
        tenant_id: membership.tenant_id,
        user_id: membership.user_id,
        month_start: monthStart
      },
      {
        onConflict: "tenant_id,user_id,month_start"
      }
    )
    .select()
    .single()

  if (!budget) {
    throw new Error("Failed to create budget")
  }

  const lines = parsed.lines.map(line => ({
    tenant_id: membership.tenant_id,
    budget_id: budget.id,
    category_id: line.category_id,
    planned_income: line.planned_income,
    planned_expense: line.planned_expense
  }))

  await supabase
    .from("budget_lines")
    .upsert(lines, {
      onConflict: "tenant_id,budget_id,category_id"
    })

  return { success: true }
}