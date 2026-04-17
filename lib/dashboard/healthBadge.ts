export type BadgeStatus = 'green' | 'amber' | 'red'

export interface HealthBadge {
  status: BadgeStatus
  label: string
}

// ---------------------------------------------------------------------------
// Month progress (A) — days elapsed ÷ days in month
// Historical month → 1.0 | Future month → 0.0 | Current month → elapsed/days
// ---------------------------------------------------------------------------

export function computeMonthProgress(monthStart: Date, today: Date = new Date()): number {
  const msYear = monthStart.getUTCFullYear()
  const msMonth = monthStart.getUTCMonth()
  const daysInMonth = new Date(Date.UTC(msYear, msMonth + 1, 0)).getUTCDate()

  const todayYear = today.getUTCFullYear()
  const todayMonth = today.getUTCMonth()
  const todayDay = today.getUTCDate()

  const isPast =
    todayYear > msYear || (todayYear === msYear && todayMonth > msMonth)
  const isFuture =
    todayYear < msYear || (todayYear === msYear && todayMonth < msMonth)

  if (isPast) return 1.0
  if (isFuture) return 0.0
  return todayDay / daysInMonth
}

// ---------------------------------------------------------------------------
// Core pace check
// B > A           → red
// B > A×0.9 ≤ A  → amber
// B ≤ A×0.9      → green
// monthProgress=0 (future) → always green
// ---------------------------------------------------------------------------

function paceStatus(b: number, a: number): BadgeStatus {
  if (a === 0) return 'green'
  if (b > a) return 'red'
  if (b > a * 0.9) return 'amber'
  return 'green'
}

// ---------------------------------------------------------------------------
// Net / Health KPI badge
// B = expenseActual ÷ incomeActual (fallback to budgetedIncome if income = 0)
// ---------------------------------------------------------------------------

export function computeNetHealthBadge(params: {
  incomeActual: number
  incomeBudgeted: number
  expenseActual: number
  expenseBudgeted: number
  monthProgress: number
}): HealthBadge {
  const { incomeActual, incomeBudgeted, expenseActual, monthProgress } = params

  const denominator = incomeActual > 0 ? incomeActual : incomeBudgeted
  if (denominator === 0) return { status: 'green', label: 'On track' }

  const b = expenseActual / denominator
  const status = paceStatus(b, monthProgress)

  const label =
    status === 'red' ? 'Ahead of pace' : status === 'amber' ? 'Watch spending' : 'On track'
  return { status, label }
}

// ---------------------------------------------------------------------------
// Per-category row badge
// Expense categories: standard pace (B > A → red)
// Income categories: inverted (B < A → amber, never red)
// budgeted=0 + actual=0 → green (neutral)
// budgeted=0 + actual>0 → red (unbudgeted spend)
// ---------------------------------------------------------------------------

export function computeCategoryBadge(
  actual: number,
  budgeted: number,
  monthProgress: number,
  isIncome = false
): BadgeStatus {
  if (monthProgress === 0) return 'green'
  if (budgeted === 0) return actual > 0 ? 'red' : 'green'

  const b = actual / budgeted

  if (isIncome) {
    // Inverted: not enough income is amber; meeting/exceeding pace is green
    return b >= monthProgress ? 'green' : b >= monthProgress * 0.9 ? 'amber' : 'amber'
  }

  return paceStatus(b, monthProgress)
}

// ---------------------------------------------------------------------------
// Income KPI badge — % of budgeted income received
// Inverted: B ≥ A → green, B < A → amber
// ---------------------------------------------------------------------------

export function computeIncomeBadge(
  actual: number,
  budgeted: number,
  monthProgress: number
): HealthBadge {
  if (budgeted === 0) return { status: 'green', label: '—' }
  const pct = Math.round((actual / budgeted) * 100)
  const b = actual / budgeted
  const status: BadgeStatus = monthProgress === 0 ? 'green' : b >= monthProgress ? 'green' : 'amber'
  return { status, label: `${pct}% received` }
}

// ---------------------------------------------------------------------------
// Expense KPI badge — % of budgeted expense used
// Standard pace formula
// ---------------------------------------------------------------------------

export function computeExpenseBadge(
  actual: number,
  budgeted: number,
  monthProgress: number
): HealthBadge {
  if (budgeted === 0) return { status: 'green', label: '—' }
  const pct = Math.round((actual / budgeted) * 100)
  const b = actual / budgeted
  const status = paceStatus(b, monthProgress)
  return { status, label: `${pct}% used` }
}
