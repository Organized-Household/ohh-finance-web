// Pure utility — no external dependencies (date-fns not available in this project)

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export interface MonthSlot {
  /** e.g. "Apr" or "Apr*" for the current (partial) month */
  label: string
  income: number
  expenses: number
  /** ISO date string YYYY-MM-01 — used as React key */
  key: string
}

/**
 * Build a 6-element array of MonthSlots going from (currentMonth - 5) to
 * currentMonth inclusive.  Months not present in `trend` are padded with 0.
 *
 * @param trend           RPC trend data — any ordering, any length
 * @param currentMonthStart  ISO string YYYY-MM-01 for the selected month
 */
export function buildSixMonthSlots(
  trend: Array<{ month_start: string; income: number; expenses: number }>,
  currentMonthStart: string
): MonthSlot[] {
  const [yearStr, monthStr] = currentMonthStart.split('-')
  const baseYear = Number(yearStr)
  const baseMonth = Number(monthStr) - 1  // 0-based

  const slots: MonthSlot[] = []

  for (let i = 5; i >= 0; i--) {
    // Subtract i months from base
    let slotMonth = baseMonth - i
    let slotYear = baseYear
    while (slotMonth < 0) {
      slotMonth += 12
      slotYear -= 1
    }

    const key = `${slotYear}-${String(slotMonth + 1).padStart(2, '0')}-01`
    const match = trend.find((t) => t.month_start === key)
    const isCurrent = i === 0

    slots.push({
      key,
      label: (MONTH_ABBR[slotMonth] ?? '') + (isCurrent ? '*' : ''),
      income: match?.income ?? 0,
      expenses: match?.expenses ?? 0,
    })
  }

  return slots
}
