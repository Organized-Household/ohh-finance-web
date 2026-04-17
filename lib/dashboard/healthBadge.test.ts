import {
  computeMonthProgress,
  computeNetHealthBadge,
  computeCategoryBadge,
  computeIncomeBadge,
  computeExpenseBadge,
} from './healthBadge'

// ---------------------------------------------------------------------------
// computeMonthProgress
// ---------------------------------------------------------------------------

describe('computeMonthProgress', () => {
  const april1 = new Date(Date.UTC(2026, 3, 1))  // Apr 2026 monthStart

  it('returns 1.0 for a past month', () => {
    const today = new Date(Date.UTC(2026, 4, 1))  // May 1 — April is past
    expect(computeMonthProgress(april1, today)).toBe(1.0)
  })

  it('returns 0.0 for a future month', () => {
    const today = new Date(Date.UTC(2026, 2, 15))  // Mar 15 — April is future
    expect(computeMonthProgress(april1, today)).toBe(0.0)
  })

  it('returns elapsed/days for current month mid-month', () => {
    const today = new Date(Date.UTC(2026, 3, 17))  // Apr 17
    expect(computeMonthProgress(april1, today)).toBeCloseTo(17 / 30, 5)
  })

  it('returns 1.0 when today is last day of month', () => {
    const today = new Date(Date.UTC(2026, 3, 30))  // Apr 30
    expect(computeMonthProgress(april1, today)).toBe(1.0)
  })

  it('returns 1/30 on the first day of the month', () => {
    const today = new Date(Date.UTC(2026, 3, 1))
    expect(computeMonthProgress(april1, today)).toBeCloseTo(1 / 30, 5)
  })
})

// ---------------------------------------------------------------------------
// computeNetHealthBadge
// ---------------------------------------------------------------------------

describe('computeNetHealthBadge', () => {
  const base = { incomeBudgeted: 5000, expenseBudgeted: 3000 }

  it('red when expense > income (B > A)', () => {
    expect(
      computeNetHealthBadge({
        ...base,
        incomeActual: 2000,
        expenseActual: 1200,  // B = 0.6, A = 0.5 → B > A
        monthProgress: 0.5,
      }).status
    ).toBe('red')
  })

  it('amber when expense is just below pace (B ∈ (A×0.9, A])', () => {
    expect(
      computeNetHealthBadge({
        ...base,
        incomeActual: 2000,
        expenseActual: 960,   // B = 0.48, A = 0.5, A×0.9 = 0.45 → amber
        monthProgress: 0.5,
      }).status
    ).toBe('amber')
  })

  it('green when expense well under pace (B ≤ A×0.9)', () => {
    expect(
      computeNetHealthBadge({
        ...base,
        incomeActual: 2000,
        expenseActual: 800,   // B = 0.4, A×0.9 = 0.45 → green
        monthProgress: 0.5,
      }).status
    ).toBe('green')
  })

  it('uses budgeted income as denominator when actual income is zero', () => {
    expect(
      computeNetHealthBadge({
        incomeActual: 0,
        incomeBudgeted: 5000,
        expenseActual: 3000,  // B = 3000/5000 = 0.6, A = 0.5 → red
        expenseBudgeted: 3000,
        monthProgress: 0.5,
      }).status
    ).toBe('red')
  })

  it('green for future month (A=0)', () => {
    expect(
      computeNetHealthBadge({
        ...base,
        incomeActual: 0,
        expenseActual: 500,
        monthProgress: 0,
      }).status
    ).toBe('green')
  })

  it('returns "Ahead of pace" label when red', () => {
    expect(
      computeNetHealthBadge({
        ...base,
        incomeActual: 2000,
        expenseActual: 1200,
        monthProgress: 0.5,
      }).label
    ).toBe('Ahead of pace')
  })

  it('returns "On track" label when green', () => {
    expect(
      computeNetHealthBadge({
        ...base,
        incomeActual: 2000,
        expenseActual: 800,
        monthProgress: 0.5,
      }).label
    ).toBe('On track')
  })

  it('returns "Watch spending" label when amber', () => {
    expect(
      computeNetHealthBadge({
        ...base,
        incomeActual: 2000,
        expenseActual: 960,
        monthProgress: 0.5,
      }).label
    ).toBe('Watch spending')
  })
})

// ---------------------------------------------------------------------------
// computeCategoryBadge
// ---------------------------------------------------------------------------

describe('computeCategoryBadge — expense', () => {
  it('red when B > A (overspending pace)', () => {
    expect(computeCategoryBadge(600, 1000, 0.5)).toBe('red')  // B=0.6 > A=0.5
  })

  it('amber when B ∈ (A×0.9, A]', () => {
    expect(computeCategoryBadge(480, 1000, 0.5)).toBe('amber')  // B=0.48, A×0.9=0.45
  })

  it('green when B ≤ A×0.9', () => {
    expect(computeCategoryBadge(400, 1000, 0.5)).toBe('green')  // B=0.4 ≤ 0.45
  })

  it('green when budgeted=0 and actual=0', () => {
    expect(computeCategoryBadge(0, 0, 0.5)).toBe('green')
  })

  it('red when budgeted=0 but actual>0 (unbudgeted spend)', () => {
    expect(computeCategoryBadge(50, 0, 0.5)).toBe('red')
  })

  it('green for future month regardless of actual', () => {
    expect(computeCategoryBadge(999, 1000, 0)).toBe('green')
  })
})

describe('computeCategoryBadge — income (inverted)', () => {
  it('green when income is at or ahead of pace', () => {
    expect(computeCategoryBadge(600, 1000, 0.5, true)).toBe('green')  // B=0.6 ≥ A=0.5
  })

  it('amber when income is behind pace', () => {
    expect(computeCategoryBadge(400, 1000, 0.5, true)).toBe('amber')  // B=0.4 < A=0.5
  })

  it('green for future month', () => {
    expect(computeCategoryBadge(0, 1000, 0, true)).toBe('green')
  })
})

// ---------------------------------------------------------------------------
// computeIncomeBadge
// ---------------------------------------------------------------------------

describe('computeIncomeBadge', () => {
  it('green when income is at or ahead of pace', () => {
    expect(computeIncomeBadge(2500, 5000, 0.5).status).toBe('green')  // B=0.5 ≥ A=0.5
  })

  it('amber when income is behind pace', () => {
    expect(computeIncomeBadge(2000, 5000, 0.5).status).toBe('amber')  // B=0.4 < A=0.5
  })

  it('formats label as percentage received', () => {
    expect(computeIncomeBadge(2500, 5000, 0.5).label).toBe('50% received')
  })

  it('green with dash when budgeted is zero', () => {
    const r = computeIncomeBadge(0, 0, 0.5)
    expect(r.status).toBe('green')
    expect(r.label).toBe('—')
  })

  it('green for future month (A=0)', () => {
    expect(computeIncomeBadge(0, 5000, 0).status).toBe('green')
  })
})

// ---------------------------------------------------------------------------
// computeExpenseBadge
// ---------------------------------------------------------------------------

describe('computeExpenseBadge', () => {
  it('red when spending ahead of pace', () => {
    expect(computeExpenseBadge(600, 1000, 0.5).status).toBe('red')
  })

  it('amber when spending approaching pace', () => {
    expect(computeExpenseBadge(480, 1000, 0.5).status).toBe('amber')
  })

  it('green when spending well under pace', () => {
    expect(computeExpenseBadge(400, 1000, 0.5).status).toBe('green')
  })

  it('formats label as percentage used', () => {
    expect(computeExpenseBadge(750, 1000, 0.5).label).toBe('75% used')
  })

  it('green with dash when budgeted is zero', () => {
    const r = computeExpenseBadge(0, 0, 0.5)
    expect(r.status).toBe('green')
    expect(r.label).toBe('—')
  })

  it('green for future month (A=0)', () => {
    expect(computeExpenseBadge(500, 1000, 0).status).toBe('green')
  })
})
