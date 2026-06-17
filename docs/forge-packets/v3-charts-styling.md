# Forge Packet v3 — Chart Strip, BVA Header, Balance Label
**Prepared by:** Forge (Senior Full Stack Engineer, OHh Platform)
**For:** Claude Code (CC) execution
**Date:** 2026-04-17
**Depends on:** ForgePacket_Dashboard_Redesign.md (v1) + ForgePacket_Dashboard_v2_Iteration.md (v2)
**Status:** Ready for implementation

---

## Jira Linkage

Same stories as v1/v2 — iteration work within the same branch.

```
feature/EPIC-6-dashboard-redesign
```

Stories: STORY-6.3, STORY-6.4, STORY-6.6

---

## Summary of Changes in This Packet

| # | Area | Change |
|---|---|---|
| 1 | Chart strip | Replace single chart with three-chart strip (3fr / 4fr / 3fr) |
| 2 | Left chart | Investment balance trend — single area line |
| 3 | Middle chart | Income vs Expenses — unchanged, already implemented |
| 4 | Right chart | Savings goals — grouped bar per account (target vs contributed all-time) |
| 5 | BVA header | Pastel title bar + light grey column header bar |
| 6 | Account tiles | Rename `opening_balance` UI label to "Current Balance" everywhere |
| 7 | Savings/Investment tiles | Pastel header bars matching existing tile accent colours |

---

## Change 1 — Three-chart strip layout

**File:** `src/components/dashboard/ChartStrip.tsx` (new component wrapping all three)

Replace the single `IncomeExpenseChart` card with a `ChartStrip` component that renders
three cards in a `3fr 4fr 3fr` grid.

```tsx
export function ChartStrip({ data, monthStart }: ChartStripProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3fr 4fr 3fr',
      gap: '10px',
    }}>
      <InvestmentTrendChart accounts={data.investment_accounts} />
      <IncomeExpenseChart trend={data.monthly_trend} currentMonthStart={monthStart} />
      <SavingsGoalsChart accounts={data.savings_accounts} />
    </div>
  )
}
```

All three are client components (`'use client'`) using Chart.js via
`dynamic(() => import('chart.js'), { ssr: false })`.

Chart card shared wrapper — extract into a reusable `ChartCard` component:

```tsx
function ChartCard({ title, legend, children }: ChartCardProps) {
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '10px 12px',
    }}>
      <div style={{
        fontSize: '9px', fontWeight: 500,
        color: 'var(--color-text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        marginBottom: '6px',
      }}>
        {title}
      </div>
      {legend}
      <div style={{ position: 'relative', width: '100%', height: '90px' }}>
        {children}
      </div>
    </div>
  )
}
```

---

## Change 2 — Left chart: Investment balance trend

**File:** `src/components/dashboard/InvestmentTrendChart.tsx`

**Data source:** `investment_accounts` array from `rpc_dashboard_summary`. Each account
has an `opening_balance` (current balance as entered by member). The chart plots the
sum of all investment account balances per month.

**Important:** The RPC currently returns only the current month's balance. To plot a
trend, the RPC needs to return historical balance snapshots. See RPC update below.

**Chart spec:**
- Type: `line`
- Single dataset: total investment balance per month
- Color: `#185fa5` (blue), fill `rgba(24,95,165,0.07)`
- `borderWidth: 1.5`, `pointRadius: 2`, `tension: 0.3`, `fill: true`
- Y-axis: `$Xk` format
- `maxBarThickness` not applicable (line chart)
- Legend: single item "Balance" with blue square

**Props:**
```typescript
interface InvestmentTrendChartProps {
  // Monthly snapshots from RPC — see RPC update below
  trend: Array<{ month_start: string; total_balance: number }>
}
```

### RPC update for investment trend

Add to `rpc_dashboard_summary`:

```sql
'investment_trend', (
  SELECT json_agg(t ORDER BY t.month_start)
  FROM (
    SELECT
      date_trunc('month', t.occurred_at)::date AS month_start,
      -- Sum of all investment-linked transaction amounts per month
      -- This approximates balance growth via contributions
      SUM(ABS(t.amount)) FILTER (
        WHERE t.linked_account_id IN (
          SELECT id FROM accounts
          WHERE tenant_id = v_tenant_id
            AND account_kind = 'investment'
            AND is_active = true
        )
      ) AS monthly_contributions
    FROM transactions t
    WHERE t.tenant_id = v_tenant_id
      AND t.status = 'posted'
      AND t.occurred_at >= (p_month_start - interval '5 months')
      AND t.occurred_at < v_month_end
    GROUP BY date_trunc('month', t.occurred_at)::date
  ) t
)
```

**Note to CC:** The ideal investment trend uses member-entered balance snapshots per
month. Since we don't have a balance history table yet, the chart plots cumulative
contributions as a proxy for balance growth. The current month shows the
`opening_balance` sum from accounts. This is a v1 approximation — a balance history
table is a future story.

**Practical implementation for v1:**
Use `buildSixMonthSlots` pattern (same as income/expense chart) — pad to 6 months,
missing months show 0. Label current month with `*`.

---

## Change 3 — Middle chart: Income vs Expenses (unchanged)

No changes to `IncomeExpenseChart.tsx` beyond what was specified in v2.
Just move it into the `ChartStrip` wrapper.

---

## Change 4 — Right chart: Savings goals

**File:** `src/components/dashboard/SavingsGoalsChart.tsx`

**Chart type:** Grouped horizontal bar chart (one group per savings account).
Two bars per group: Target (light green) and Contributed all-time (dark green).

**"Contributed all-time"** = `SUM(ABS(amount))` of all posted transactions where
`linked_account_id = account.id`, across ALL time (not filtered to selected month).
This measures total progress toward the goal.

**Data source:** Add to `rpc_dashboard_summary`:

```sql
'savings_goals', (
  SELECT json_agg(g)
  FROM (
    SELECT
      a.id,
      a.name,
      a.target_amount,
      a.target_date,
      COALESCE(SUM(ABS(t.amount)) FILTER (
        WHERE t.linked_account_id = a.id
          AND t.status = 'posted'
      ), 0) AS contributed_all_time
    FROM accounts a
    LEFT JOIN transactions t ON t.linked_account_id = a.id
      AND t.tenant_id = v_tenant_id
    WHERE a.tenant_id = v_tenant_id
      AND a.account_kind = 'savings'
      AND a.is_active = true
      AND a.target_amount IS NOT NULL   -- only show accounts with a target set
    GROUP BY a.id, a.name, a.target_amount, a.target_date
  ) g
)
```

**Accounts without `target_amount` are excluded from this chart.**
If NO savings accounts have a target set, show an empty state message inside the
chart card: `"Set a target on your savings accounts to track progress."` in muted
11px text, vertically centred.

**Chart spec:**
```typescript
{
  type: 'bar',
  data: {
    labels: accountNames,  // truncate to 12 chars + '…' if longer
    datasets: [
      {
        label: 'Target',
        data: targetAmounts,
        backgroundColor: '#9fe1cb',  // light green
        borderRadius: 3,
        maxBarThickness: 18,
      },
      {
        label: 'Contributed',
        data: contributedAmounts,
        backgroundColor: '#1d9e75',  // dark green
        borderRadius: 3,
        maxBarThickness: 18,
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` $${ctx.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 }, color: '#888780',
                 autoSkip: false, maxRotation: 30 }
      },
      y: {
        grid: { color: 'rgba(136,135,128,0.12)' },
        ticks: {
          font: { size: 9 }, color: '#888780',
          callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)
        },
        beginAtZero: true
      }
    }
  }
}
```

**Legend (HTML, above canvas):**
```tsx
<div style={{ display: 'flex', gap: '10px', fontSize: '9px',
              color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
    <span style={{ width: '8px', height: '8px', borderRadius: '2px',
                   background: '#9fe1cb', display: 'inline-block' }} />
    Target
  </span>
  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
    <span style={{ width: '8px', height: '8px', borderRadius: '2px',
                   background: '#1d9e75', display: 'inline-block' }} />
    Contributed
  </span>
</div>
```

---

## Change 5 — BVA header styling

**File:** `src/components/dashboard/BudgetVsActualTable.tsx`

### Title bar (top)
Pastel blue — same family as the existing tile headers but distinct.

```tsx
// Title bar
<div style={{
  background: '#dbeafe',           // pastel blue
  padding: '7px 12px',
  borderRadius: 'var(--border-radius-lg) var(--border-radius-lg) 0 0',
}}>
  <span style={{
    fontSize: '11px',
    fontWeight: 500,
    color: '#1e40af',              // deep blue text on pastel blue
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }}>
    Budget vs Actual
  </span>
</div>
```

### Column header bar (below title)
Light grey background, black bold smaller text. Must not visually overpower the
title bar above it.

```tsx
// Column header bar
<div style={{
  display: 'grid',
  gridTemplateColumns: '32% 18% 1fr 1fr 1fr',
  background: '#f1f5f9',           // light grey
  padding: '4px 12px',
}}>
  {['Category', 'Progress', 'Budgeted', 'Actual', 'Variance'].map((col, i) => (
    <span key={col} style={{
      fontSize: '9px',
      fontWeight: 700,             // bold
      color: '#374151',            // dark grey/near-black
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      textAlign: i === 0 ? 'left' : 'right',
    }}>
      {col}
    </span>
  ))}
</div>
```

**Visual hierarchy rule:** Title bar background (`#dbeafe`) must be more saturated/
colourful than the column header bar (`#f1f5f9`). Column header font size (9px bold)
must be smaller than title bar font size (11px medium). This ensures the title bar
reads first.

### Matching tile header colours (Savings, Investments, Debts, Credit Cards)

Apply the same pastel header pattern to all four account tiles:

| Tile | Background | Text color |
|---|---|---|
| Savings | `#d1fae5` (pastel green) | `#065f46` (deep green) |
| Investments | `#dbeafe` (pastel blue) | `#1e40af` (deep blue) |
| Debts | `#fee2e2` (pastel red) | `#991b1b` (deep red) |
| Credit Cards | `#ede9fe` (pastel purple) | `#5b21b6` (deep purple) |
| Budget vs Actual | `#fef9c3` (pastel yellow) | `#854d0e` (deep amber) |

> BVA gets pastel yellow — distinct from all four account tiles so it doesn't
> visually group with any of them.

---

## Change 6 — "Current Balance" UI label

**Affects:** All account tile components and any tooltip/header that references
the balance field.

**Rule:** The DB column remains `opening_balance`. Every UI label that displays
this value must use **"Current Balance"** — not "Opening Balance", not "Balance Owed"
(except for Debts/Credit Cards where "Balance Owed" is more accurate — see below).

| Tile | UI label for balance column |
|---|---|
| Savings | Current Balance |
| Investments | Current Balance |
| Debts | Balance Owed |
| Credit Cards | Balance Owed |

**Update the Decision Log** — add this label convention so future sessions don't
revert to "opening balance" in the UI.

---

## Change 7 — Account tile column headers

Apply the same column header styling as BVA (light grey bg, bold small dark text)
to the column header rows inside Savings, Investments, Debts, and Credit Cards tiles.

```tsx
// Reusable tile column header row
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 80px 65px 65px',
  background: '#f1f5f9',
  padding: '4px 12px',
  fontSize: '9px',
  fontWeight: 700,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}}>
  <span>Account</span>
  <span style={{ textAlign: 'right' }}>Current Balance</span>
  <span style={{ textAlign: 'right' }}>{inLabel}</span>
  <span style={{ textAlign: 'right' }}>{outLabel}</span>
</div>
```

Where `inLabel` / `outLabel` per tile:

| Tile | inLabel | outLabel |
|---|---|---|
| Savings | In | Out |
| Investments | In | Out |
| Debts | Paid | Spent |
| Credit Cards | Payment | Charged |

---

## Updated Commit Message

```
feat(EPIC-6): three-chart strip, BVA/tile pastel headers, savings goals chart, current balance label

- ChartStrip component: 3fr/4fr/3fr grid replacing single chart
- Left: InvestmentTrendChart — area line, 6-month contribution trend
- Middle: IncomeExpenseChart — unchanged, moved into strip
- Right: SavingsGoalsChart — grouped bar per account (target vs contributed all-time)
  - Excludes accounts with no target_amount set; shows empty state if none
  - Contributed = all-time SUM of linked transactions (not month-scoped)
- BVA header: pastel yellow title bar + light grey column header bar
- All account tile headers: pastel colour bars matching kind
  (savings=green, investments=blue, debts=red, credit cards=purple)
- Column header rows on all tiles: light grey bg, bold 9px dark text
- Balance field UI label: "Current Balance" for savings/investments,
  "Balance Owed" for debts/credit cards
- RPC additions: investment_trend and savings_goals aggregations

Stories: STORY-6.3, STORY-6.4, STORY-6.6
```

---

## Docs Commit — Required in This PR

CC must commit the following files to the repo as part of this PR. This makes the
Decision Log and Forge Packets available directly from GitHub so future sessions
can reference them without manual file attachment.

**Files to commit:**

```
docs/decision-log.md                        ← OHhFinance_DecisionLog.md (this session)
docs/forge-packets/v1-dashboard.md          ← ForgePacket_Dashboard_Redesign.md
docs/forge-packets/v2-dashboard-iteration.md ← ForgePacket_Dashboard_v2_Iteration.md
docs/forge-packets/v3-charts-styling.md     ← ForgePacket_Dashboard_v3_Charts.md (this file)
```

**Add to the commit message:**
```
docs: add decision-log and forge-packets to /docs for future session continuity
```

**Why this matters:**
- Future Forge sessions read `docs/decision-log.md` from the repo instead of requiring
  manual file attachment
- Scribe can pull decisions directly from GitHub
- CC can reference the Decision Log during implementation when hitting ambiguous cases
- Forge Packets provide an audit trail of what was built and why

---

## Notes for CC

1. **BVA pastel yellow is intentional** — it must differ from all four account tile
   colours. Do not use pastel blue (Investments) or pastel green (Savings) for BVA.

2. **Savings goals chart excludes accounts without `target_amount`** — this is by
   design. The chart only makes sense for goal-oriented accounts. Accounts missing
   a target should prompt the user to set one (show empty state message).

3. **Investment trend is a v1 approximation** — it plots cumulative contributions,
   not actual balance history. A balance history table is a future story. Do not
   build the history table in this PR.

4. **`contributed_all_time` is not month-scoped** — the savings goals query sums
   ALL posted transactions linked to the account across all time. This is correct
   and intentional — it measures total progress toward the goal.

5. **`target_date` is available but not displayed in the chart** — it can be shown
   as a tooltip on the bar (e.g. "Target date: Dec 2026") without changing the
   chart structure. Implement if straightforward, defer if complex.

6. **Do not change the 3fr/2fr split on the main content row.** Only the chart
   strip row uses 3fr/4fr/3fr.

7. **Chart card height stays at 90px wrapper** — all three charts use the same
   height for visual consistency across the strip.
