import { createClient } from '@/lib/supabase/server'

export type MonthlyTrendPoint = {
  month_start: string
  income: number
  expenses: number
}

export type BudgetVsActualRpcRow = {
  category_id: string
  category_name: string
  category_type: 'income' | 'expense'
  tag: string
  budgeted: number
  actual: number
}

export type DashboardAccount = {
  id: string
  name: string
  opening_balance: number | null
  interest_rate: number | null
  in_this_month: number
  out_this_month: number
  account_subtype?: string | null
  // debts
  paid_this_month?: number
  // credit cards
  charged_this_month?: number
  payment_this_month?: number
}

export type InvestmentTrendPoint = {
  month_start: string
  contributed: number   // RPC field name — matches investment_trend sub-query AS contributed
}

export type SavingsGoal = {
  id: string
  name: string
  target_amount: number
  target_date: string | null
  contributed_all_time: number
}

export type DashboardSummary = {
  income_total: number
  expense_total: number
  budgeted_income: number
  budgeted_expense: number
  monthly_trend: MonthlyTrendPoint[] | null
  budget_vs_actual: BudgetVsActualRpcRow[] | null
  savings_accounts: DashboardAccount[] | null
  investment_accounts: DashboardAccount[] | null
  debt_accounts: DashboardAccount[] | null
  credit_card_accounts: DashboardAccount[] | null
  investment_trend: InvestmentTrendPoint[] | null
  savings_goals: SavingsGoal[] | null
  pending_review_count: number
  budget_is_set: boolean
  last_transaction_date: string | null
}

export async function getDashboardSummary(
  monthStartIso: string
): Promise<DashboardSummary> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('rpc_dashboard_summary', {
    p_month_start: monthStartIso,
  })

  if (error) {
    throw new Error(`[getDashboardSummary] RPC failed: ${error.message}`)
  }

  const summary = data as DashboardSummary

  return {
    income_total: Number(summary.income_total ?? 0),
    expense_total: Number(summary.expense_total ?? 0),
    budgeted_income: Number(summary.budgeted_income ?? 0),
    budgeted_expense: Number(summary.budgeted_expense ?? 0),
    monthly_trend: summary.monthly_trend ?? null,
    budget_vs_actual: summary.budget_vs_actual ?? null,
    savings_accounts: summary.savings_accounts ?? null,
    investment_accounts: summary.investment_accounts ?? null,
    debt_accounts: summary.debt_accounts ?? null,
    credit_card_accounts: summary.credit_card_accounts ?? null,
    investment_trend: summary.investment_trend ?? null,
    savings_goals: summary.savings_goals ?? null,
    pending_review_count: Number(summary.pending_review_count ?? 0),
    budget_is_set: Boolean(summary.budget_is_set),
    last_transaction_date: summary.last_transaction_date ?? null,
  }
}
