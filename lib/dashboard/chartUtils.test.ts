import { buildSixMonthSlots } from './chartUtils'

const APR = '2026-04-01'

const fullTrend = [
  { month_start: '2025-11-01', income: 100, expenses: 80 },
  { month_start: '2025-12-01', income: 200, expenses: 150 },
  { month_start: '2026-01-01', income: 300, expenses: 250 },
  { month_start: '2026-02-01', income: 400, expenses: 300 },
  { month_start: '2026-03-01', income: 500, expenses: 400 },
  { month_start: '2026-04-01', income: 600, expenses: 500 },
]

describe('buildSixMonthSlots', () => {
  it('always returns exactly 6 slots', () => {
    expect(buildSixMonthSlots([], APR)).toHaveLength(6)
    expect(buildSixMonthSlots(fullTrend, APR)).toHaveLength(6)
  })

  it('slots span (currentMonth - 5) through currentMonth', () => {
    const slots = buildSixMonthSlots([], APR)
    expect(slots[0].key).toBe('2025-11-01')
    expect(slots[5].key).toBe('2026-04-01')
  })

  it('marks the last slot with * suffix', () => {
    const slots = buildSixMonthSlots([], APR)
    expect(slots[5].label).toBe('Apr*')
    expect(slots[4].label).toBe('Mar')
    expect(slots[0].label).toBe('Nov')
  })

  it('fills data from trend when present', () => {
    const slots = buildSixMonthSlots(fullTrend, APR)
    expect(slots[0].income).toBe(100)
    expect(slots[0].expenses).toBe(80)
    expect(slots[5].income).toBe(600)
    expect(slots[5].expenses).toBe(500)
  })

  it('pads missing months with zeros', () => {
    const partial = [{ month_start: '2026-04-01', income: 600, expenses: 500 }]
    const slots = buildSixMonthSlots(partial, APR)
    // Slots 0-4 have no data
    for (let i = 0; i < 5; i++) {
      expect(slots[i].income).toBe(0)
      expect(slots[i].expenses).toBe(0)
    }
    expect(slots[5].income).toBe(600)
  })

  it('pads when current month is missing from trend', () => {
    const withoutCurrent = fullTrend.filter((t) => t.month_start !== APR)
    const slots = buildSixMonthSlots(withoutCurrent, APR)
    expect(slots[5].income).toBe(0)
    expect(slots[5].expenses).toBe(0)
    expect(slots[5].key).toBe(APR)
  })

  it('handles year wrap-around correctly (Jan current month)', () => {
    const jan = '2026-01-01'
    const slots = buildSixMonthSlots([], jan)
    expect(slots[0].key).toBe('2025-08-01')
    expect(slots[5].key).toBe('2026-01-01')
    expect(slots[0].label).toBe('Aug')
    expect(slots[5].label).toBe('Jan*')
  })

  it('returns all zeros when trend is empty', () => {
    const slots = buildSixMonthSlots([], APR)
    for (const s of slots) {
      expect(s.income).toBe(0)
      expect(s.expenses).toBe(0)
    }
  })
})
