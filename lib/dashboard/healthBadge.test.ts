import {
  computeNetHealthBadge,
  computeCategoryBadge,
  computeIncomeBadge,
  computeExpenseBadge,
} from './healthBadge'

describe('computeNetHealthBadge', () => {
  it('returns green when expenses are well under income and budget', () => {
    expect(
      computeNetHealthBadge({
        incomeActual: 5000,
        incomeBudgeted: 8000,
        expenseActual: 900,
        expenseBudgeted: 2100,
      }).status
    ).toBe('green')
  })

  it('returns amber when expenses approach budget (80–100%)', () => {
    expect(
      computeNetHealthBadge({
        incomeActual: 5000,
        incomeBudgeted: 5000,
        expenseActual: 1800,
        expenseBudgeted: 2100,
      }).status
    ).toBe('amber')
  })

  it('returns red when expenses exceed income', () => {
    expect(
      computeNetHealthBadge({
        incomeActual: 1000,
        incomeBudgeted: 5000,
        expenseActual: 1200,
        expenseBudgeted: 2100,
      }).status
    ).toBe('red')
  })

  it('returns red label "Over budget"', () => {
    expect(
      computeNetHealthBadge({
        incomeActual: 1000,
        incomeBudgeted: 5000,
        expenseActual: 1200,
        expenseBudgeted: 2100,
      }).label
    ).toBe('Over budget')
  })

  it('returns green label "On track"', () => {
    expect(
      computeNetHealthBadge({
        incomeActual: 5000,
        incomeBudgeted: 8000,
        expenseActual: 900,
        expenseBudgeted: 2100,
      }).label
    ).toBe('On track')
  })

  it('defaults to red when incomeActual is zero (expense ratio = 1)', () => {
    expect(
      computeNetHealthBadge({
        incomeActual: 0,
        incomeBudgeted: 5000,
        expenseActual: 100,
        expenseBudgeted: 2100,
      }).status
    ).toBe('green') // expense/budget ratio = 100/2100 ≈ 4.8% → green wins
  })

  it('uses worst ratio when income ratio is green but budget ratio is amber', () => {
    expect(
      computeNetHealthBadge({
        incomeActual: 5000,
        incomeBudgeted: 5000,
        expenseActual: 1700,
        expenseBudgeted: 2000,
      }).status
    ).toBe('amber') // expense/budget = 85% → amber
  })
})

describe('computeCategoryBadge', () => {
  it('green when actual < 80% of budgeted', () => {
    expect(computeCategoryBadge(100, 200)).toBe('green')
  })

  it('amber when actual is 80–100% of budgeted', () => {
    expect(computeCategoryBadge(180, 200)).toBe('amber')
  })

  it('red when actual exceeds budgeted', () => {
    expect(computeCategoryBadge(210, 200)).toBe('red')
  })

  it('green when budgeted is zero', () => {
    expect(computeCategoryBadge(0, 0)).toBe('green')
  })

  it('amber at exactly 80%', () => {
    expect(computeCategoryBadge(160, 200)).toBe('amber')
  })

  it('green just below 80%', () => {
    expect(computeCategoryBadge(159, 200)).toBe('green')
  })
})

describe('computeIncomeBadge', () => {
  it('green when >= 50% of budgeted income received', () => {
    expect(computeIncomeBadge(2500, 5000).status).toBe('green')
  })

  it('amber when < 50% of budgeted income received', () => {
    expect(computeIncomeBadge(2400, 5000).status).toBe('amber')
  })

  it('formats label as percentage received', () => {
    expect(computeIncomeBadge(2500, 5000).label).toBe('50% received')
  })

  it('returns green with dash label when budgeted is zero', () => {
    const result = computeIncomeBadge(0, 0)
    expect(result.status).toBe('green')
    expect(result.label).toBe('—')
  })
})

describe('computeExpenseBadge', () => {
  it('green when < 80% of budget used', () => {
    expect(computeExpenseBadge(700, 1000).status).toBe('green')
  })

  it('amber when 80–100% of budget used', () => {
    expect(computeExpenseBadge(850, 1000).status).toBe('amber')
  })

  it('red when over 100% of budget used', () => {
    expect(computeExpenseBadge(1100, 1000).status).toBe('red')
  })

  it('formats label as percentage used', () => {
    expect(computeExpenseBadge(750, 1000).label).toBe('75% used')
  })

  it('returns green with dash label when budgeted is zero', () => {
    const result = computeExpenseBadge(0, 0)
    expect(result.status).toBe('green')
    expect(result.label).toBe('—')
  })
})
