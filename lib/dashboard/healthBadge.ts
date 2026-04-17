export type BadgeStatus = 'green' | 'amber' | 'red'

export interface HealthBadge {
  status: BadgeStatus
  label: string
}

/** Overall net health — worst of expense/income ratio vs expense/budget ratio */
export function computeNetHealthBadge(params: {
  incomeActual: number
  incomeBudgeted: number
  expenseActual: number
  expenseBudgeted: number
}): HealthBadge {
  const { incomeActual, incomeBudgeted, expenseActual, expenseBudgeted } = params

  const expenseVsIncomeRatio = incomeActual > 0 ? expenseActual / incomeActual : 1
  const expenseVsBudgetRatio = expenseBudgeted > 0 ? expenseActual / expenseBudgeted : 0

  const worstRatio = Math.max(expenseVsIncomeRatio, expenseVsBudgetRatio)

  if (worstRatio > 1) return { status: 'red', label: 'Over budget' }
  if (worstRatio >= 0.8) return { status: 'amber', label: 'Caution' }
  return { status: 'green', label: 'On track' }
}

/** Per-category row badge */
export function computeCategoryBadge(actual: number, budgeted: number): BadgeStatus {
  if (budgeted === 0) return 'green'
  const ratio = actual / budgeted
  if (ratio > 1) return 'red'
  if (ratio >= 0.8) return 'amber'
  return 'green'
}

/** Income KPI badge — how much of budgeted income has been received */
export function computeIncomeBadge(actual: number, budgeted: number): HealthBadge {
  if (budgeted === 0) return { status: 'green', label: '—' }
  const pct = Math.round((actual / budgeted) * 100)
  return {
    status: pct >= 50 ? 'green' : 'amber',
    label: `${pct}% received`,
  }
}

/** Expense KPI badge — how much of budgeted expense has been used */
export function computeExpenseBadge(actual: number, budgeted: number): HealthBadge {
  if (budgeted === 0) return { status: 'green', label: '—' }
  const pct = Math.round((actual / budgeted) * 100)
  const status: BadgeStatus = pct > 100 ? 'red' : pct >= 80 ? 'amber' : 'green'
  return { status, label: `${pct}% used` }
}
