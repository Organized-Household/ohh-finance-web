# Forge Packet v2 — Dashboard Iteration Fixes
**Prepared by:** Forge (Senior Full Stack Engineer, OHh Platform)
**For:** Claude Code (CC) execution
**Date:** 2026-04-17
**Depends on:** ForgePacket_Dashboard_Redesign.md (v1) — apply this on top of that work
**Status:** Ready for implementation

---

## Jira Linkage

Same stories as v1 — this packet is iteration/fix work within the same branch.

```
feature/EPIC-6-dashboard-redesign
```

---

## Context: Migrations Already Applied

Both schema migrations from v1 have been confirmed applied to Supabase without errors:
- `opening_balance NUMERIC(12,2) NULL` on `accounts` ✅
- `interest_rate NUMERIC(5,4) NULL` on `accounts` ✅

CC may query these columns directly — no null-guard fallback needed in the RPC.
Components should still display `—` if the value is null (user hasn't entered it yet), but
the columns exist.

---

## Summary of Changes in This Packet

| # | Area | Change |
|---|---|---|
| 1 | Budget vs Actual | Height-lock to right column — must use ResizeObserver correctly |
| 2 | Budget vs Actual | Remove progress bar from its own row — move inline, outlined style |
| 3 | Budget vs Actual | Add Progress column header; compact row height |
| 4 | Budget vs Actual | Reduce all vertical spacing/padding across the table |
| 5 | Account tiles | Add Balance column to Savings, Investments, Debts, Credit Cards |
| 6 | Debt tile | Rename columns: "In" → "Paid", "Paid" → "Spent" |
| 7 | Credit Cards tile | Fix RLS/subtype query — `account_subtype = 'credit_card'` |
| 8 | Chart | Cap bar width so single-month data doesn't stretch |
| 9 | Middle panel | Keep it — move Household Member selector tile into middle panel |
| 10 | "Budget Set" logic | Define as: budgets row exists AND at least one budget_line amount > 0 |
| 11 | Global | Reduce inter-row gap and component padding to minimise vertical scroll |
| 12 | KPI cards | Horizontal layout — label+badge left, divider, value+sub right — halves card height |
| 13 | Health badge logic | Replace ratio thresholds with pace formula (A = days elapsed ÷ days in month, B = actual ÷ denominator) |

---

## Change 1 & 4 — BudgetVsActualTable height-lock (fix ResizeObserver)

The v1 implementation did not correctly constrain the BVA table to match the right
column height. CC must implement this precisely.

**File:** `src/components/dashboard/BudgetVsActualTable.tsx`

The component receives a `rightColRef: React.RefObject<HTMLDivElement>` from the parent.
Use `useLayoutEffect` (not `useEffect`) to avoid flash of wrong height. Observe the right
column with `ResizeObserver` and set the BVA card height to match.

```typescript
useLayoutEffect(() => {
  const el = rightColRef.current
  if (!el) return

  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const totalH = entry.contentRect.height
      if (bvaCardRef.current) {
        bvaCardRef.current.style.height = `${totalH}px`
      }
      if (bvaScrollRef.current && bvaHeaderRef.current && bvaFooterRef.current) {
        const scrollH = totalH
          - bvaHeaderRef.current.offsetHeight
          - bvaFooterRef.current.offsetHeight
        bvaScrollRef.current.style.maxHeight = `${scrollH}px`
        bvaScrollRef.current.style.overflowY = 'auto'
      }
    }
  })

  observer.observe(el)
  return () => observer.disconnect()
}, [rightColRef])
```

Four refs required on the BVA card:
- `bvaCardRef` — the outer card div (receives the dynamic height)
- `bvaHeaderRef` — the title header div (pinned, not scrolled)
- `bvaScrollRef` — the tbody scroll wrapper div (receives maxHeight)
- `bvaFooterRef` — the totals row div (pinned outside scroll)

The parent page must attach `rightColRef` to the div wrapping the stacked
Savings + Investments tiles:

```tsx
const rightColRef = useRef<HTMLDivElement>(null)

// In JSX:
<div ref={rightColRef} style={{ display: 'flex', flexDirection: 'column', gap: ... }}>
  <SavingsTile ... />
  <InvestmentsTile ... />
</div>
```

**Scrollbar styling** — thin, subtle, right edge of scroll container only:
```css
.bva-scroll::-webkit-scrollbar { width: 4px; }
.bva-scroll::-webkit-scrollbar-track { background: transparent; }
.bva-scroll::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 2px; }
```

---

## Change 2 & 3 — Progress bar: inline outlined style, no extra row height

**Remove** the current implementation where the progress bar sits on its own line below
the category name. This is what's causing excessive row height.

**Replace** with an outlined progress bar that lives in a dedicated `Progress` column,
same row as the category name and numbers. The bar has a visible outline so users can
see where 100% is, and the filled portion shows actual usage.

### Column structure (updated)

| Col | Width | Content |
|---|---|---|
| Category | 30% | Name only (red + bold if over budget) |
| Progress | 18% | Outlined bar — see spec below |
| Budgeted | right-align | Dollar amount |
| Actual | right-align | Dollar amount |
| Variance | right-align | +/- dollar, green/red |

### Progress bar spec

```tsx
// Props: pct = actual/budgeted * 100, capped display at 100%, color logic below
function ProgressBar({ pct }: { pct: number }) {
  const filled = Math.min(pct, 100)
  const color = pct > 100 ? '#e24b4a' : pct >= 80 ? '#ef9f27' : '#1d9e75'
  return (
    <div style={{
      width: '100%',
      height: '6px',
      border: '1px solid var(--color-border-secondary)',  // outline shows full 100%
      borderRadius: '3px',
      overflow: 'hidden',
      backgroundColor: 'transparent',
    }}>
      <div style={{
        width: `${filled}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: '2px',
      }} />
    </div>
  )
}
```

The outline border means users see the full bar width as the 100% reference even when
actual is 0%. The fill slides in from the left. Over-budget categories show a full red bar.

---

## Change 5 — Balance column on all four account tiles

Migration B is applied. All four tiles (Savings, Investments, Debts, Credit Cards)
must now show a Balance column.

### Column layout per tile type

**Savings tile columns:** Account | Balance | In | Out

**Investments tile columns:** Account | Balance | In | Out

**Debts tile columns:** Account | Balance | Paid (was "In") | Spent (was "Paid")

**Credit Cards tile columns:** Account | Balance | Charged | Payment

### Balance calculation (display only — no DB field for running balance)

```typescript
// For savings and investments:
// balance = opening_balance ?? null
// If null → display "—"
// Note: running balance computation (opening + in - out) is a v2 feature
// For v1: display opening_balance as the balance, with a tooltip or sub-label "opening"

// For debts and credit cards:
// Same — display opening_balance directly, labeled clearly
// "Balance" column header is sufficient for v1
```

> The user enters `opening_balance` when creating/editing the account.
> Display it as-is. Do not attempt to compute a running balance in v1.
> If `opening_balance` is null, display `—`.

### Interest rate display

If `interest_rate` is not null, show it as a small muted sub-label under the account name:
```
Dad's TFSA
4.89% p.a.          ← 10px, muted color, only shown if interest_rate not null
```

### Tile column width guidance

```
Account name col: flex 1 (takes remaining space)
Balance col: 90px right-aligned
In/Paid col: 70px right-aligned
Out/Spent/Charged/Payment col: 70px right-aligned
```

---

## Change 6 — Debt tile column rename

| Old label | New label | Meaning |
|---|---|---|
| In | Paid | Money paid INTO the debt (reducing balance) — `linked_account_id` |
| Paid | Spent | Money spent VIA the debt account (charges) — `payment_source_account_id` |

Update both the column header in the component and the tile total label:
- Old: "Total owed" with sub "Total paid"
- New: Keep "Total owed" for balance; rename payment summary to "Total spent this month"

---

## Change 7 — Credit Cards tile: fix subtype query in RPC

The credit card tile is showing empty because the RPC filter is not matching correctly.

**File:** `supabase/migrations/XXXXXX_rpc_dashboard_summary.sql`

In the `credit_card_accounts` section of the RPC, the filter must be:

```sql
WHERE a.tenant_id = v_tenant_id
  AND a.account_kind = 'debt'
  AND a.account_subtype = 'credit_card'   -- exact string match, lowercase
  AND a.is_active = true
```

CC must verify the actual values stored in `accounts.account_subtype` for credit card
accounts in the database. If the stored value is `'credit_card'` this filter is correct.
If it differs (e.g. `'Credit Card'`, `'creditcard'`), adjust to match.

**Verification query to run against Supabase before deploying the RPC fix:**
```sql
SELECT DISTINCT account_subtype
FROM accounts
WHERE account_kind = 'debt';
```

If the result is not `'credit_card'` (lowercase, underscore), either:
- Fix the data (update existing rows), OR
- Update the RPC filter to match the actual stored value

**Also verify** the `payment_source_account_id` join — the charges query must be:
```sql
ABS(COALESCE(SUM(t.amount) FILTER (
  WHERE t.payment_source_account_id = a.id
  AND t.occurred_at >= p_month_start
  AND t.occurred_at < v_month_end
  AND t.status = 'posted'
), 0)) AS charged_this_month
```

And payments (money sent TO the credit card to pay it down) must use `linked_account_id`:
```sql
ABS(COALESCE(SUM(t.amount) FILTER (
  WHERE t.linked_account_id = a.id
  AND t.occurred_at >= p_month_start
  AND t.occurred_at < v_month_end
  AND t.status = 'posted'
), 0)) AS payment_this_month
```

---

## Change 8 — Chart: cap bar width for sparse data

**File:** `src/components/dashboard/IncomeExpenseChart.tsx`

Add `maxBarThickness` to both bar datasets. This prevents bars from stretching to full
width when only one or two months of data exist.

```typescript
datasets: [
  {
    label: 'Income',
    data: incomeData,
    backgroundColor: '#1d9e75',
    borderRadius: 3,
    maxBarThickness: 32,   // ← add this
    order: 2,
  },
  {
    label: 'Expenses',
    data: expenseData,
    backgroundColor: '#d85a30',
    borderRadius: 3,
    maxBarThickness: 32,   // ← add this
    order: 2,
  },
  // net line dataset unchanged
]
```

Also ensure the chart always renders 6 month slots even if data exists for fewer months.
Pad missing months with `0` values so the x-axis always shows 6 labels and bars are
always proportionally sized:

```typescript
// In the component, before passing to Chart.js:
// Build a 6-slot array from (currentMonth - 5) to currentMonth
// For months with no data in the trend array, use { income: 0, expenses: 0 }
const SIX_MONTHS = buildSixMonthSlots(trend, currentMonthStart)
// buildSixMonthSlots: pure utility in src/lib/dashboard/chartUtils.ts
```

**File:** `src/lib/dashboard/chartUtils.ts`

```typescript
import { format, subMonths, startOfMonth, parseISO } from 'date-fns'

export interface MonthSlot {
  label: string      // e.g. "Nov", "Apr*" for current month
  income: number
  expenses: number
}

export function buildSixMonthSlots(
  trend: Array<{ month_start: string; income: number; expenses: number }>,
  currentMonthStart: string
): MonthSlot[] {
  const current = startOfMonth(parseISO(currentMonthStart))
  const slots: MonthSlot[] = []

  for (let i = 5; i >= 0; i--) {
    const d = subMonths(current, i)
    const key = format(d, 'yyyy-MM-01')
    const match = trend.find(t => t.month_start === key)
    const isCurrent = i === 0
    slots.push({
      label: format(d, 'MMM') + (isCurrent ? '*' : ''),
      income: match?.income ?? 0,
      expenses: match?.expenses ?? 0,
    })
  }

  return slots
}
```

---

## Change 9 — Middle panel: Household Member selector

Keep the middle panel. Move the Household Member card into it.

The middle panel currently shows Month context rows (Selected, Window start).
**Replace** the Month context rows entirely — the month picker in the top-right already
communicates this. The middle panel should contain only:

```
[Household Member card]
  - Avatar + name + role
  - Pending review count (amber if > 0)
  - Budget Set: Yes/No  (see Change 10 for logic)
  - Last import date
```

No other content in the middle panel for v1. Keep it clean.

---

## Change 10 — "Budget Set" logic (correct definition)

**File:** `src/app/api/dashboard/route.ts` (or inside the RPC)

Current implementation checks only for existence of a `budgets` row. This fires "Yes"
even for an empty budget. Correct definition:

> A budget is considered "set" for a given month when a `budgets` row exists
> AND at least one `budget_lines` row for that budget has `amount > 0`.

**Update the RPC `budget_is_set` field:**

```sql
'budget_is_set', (
  SELECT EXISTS (
    SELECT 1
    FROM budgets b
    JOIN budget_lines bl ON bl.budget_id = b.id
    WHERE b.tenant_id = v_tenant_id
      AND b.month_start = p_month_start
      AND bl.amount > 0
  )
)
```

---

## Change 12 — KPI cards: horizontal layout

**File:** `src/components/dashboard/KpiCard.tsx`

Replace the current vertical stack (label → value → sub → badge) with a horizontal
split layout. This roughly halves the card height while preserving all information.

**New layout structure:**
```
[Label (top-left)]   | thin divider |   [Value (large, right-aligned)]
[Badge (bottom-left)]                   [Sub-text (small, right-aligned)]
```

**Implementation:**

```tsx
export function KpiCard({ label, value, sub, badge, valueColor }: KpiCardProps) {
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '10px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
    }}>
      {/* Left: label + badge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
        <span style={{
          fontSize: '9px', fontWeight: 500,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {label}
        </span>
        <HealthBadge status={badge.status} label={badge.label} />
      </div>

      {/* Divider */}
      <div style={{
        width: '0.5px', height: '32px',
        background: 'var(--color-border-tertiary)',
        flexShrink: 0,
      }} />

      {/* Right: value + sub */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: '20px', fontWeight: 500, lineHeight: 1.1,
          color: valueColor === 'income' ? '#1d9e75'
               : valueColor === 'expense' ? '#d85a30'
               : '#185fa5',
        }}>
          {value}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          {sub}
        </div>
      </div>
    </div>
  )
}
```

**No changes to props interface** — same `KpiCardProps` as v1. Only the internal
layout changes. The three KPI cards remain in a `grid-template-columns: repeat(3, 1fr)`
row spanning the full width (middle panel is now separate, so these three cards take
the full content width).

---

## Change 11 — Global vertical spacing reduction

The goal is to fit the entire dashboard in one viewport without scrolling on a typical
1080p screen. Every pixel of padding saved counts.

Apply these changes globally across all dashboard components:

| Element | Current (estimated) | Target |
|---|---|---|
| Card padding | 13px 15px | 8px 12px |
| Inter-row gap | 14px | 8px |
| Inter-card gap within rows | 11px | 8px |
| BVA table row padding | 5px 6px | 3px 5px |
| BVA group header padding | 6px 5px | 3px 5px |
| Account tile row padding | 5px 0 | 3px 0 |
| KPI card value font size | 20px | 17px |
| KPI card label font size | 10px | 9px |
| Section title font size | 10px | 9px |
| BVA table font size | 12px | 11px |
| Account tile font size | 12px | 11px |
| Account tile meta font size | 10px | 9px |
| Chart wrapper height | 100px | 80px |

These are targets — CC should tune by visual inspection and aim for no scroll on a
1920×1080 viewport with the browser at 100% zoom. If one section still pushes over,
prioritise reducing BVA row padding further before touching font sizes.

---

## Change 13 — Health badge logic: replace with pace formula

**Replaces** the old ratio threshold approach in both v1 packet and this iteration.
**Affects:** `src/lib/dashboard/healthBadge.ts` — full replacement, see v1 packet for
complete implementation. Summary of the formula for CC:

```
A = days elapsed in selected month ÷ total days in month
B = actual ÷ denominator

B > A          → Red   ("Ahead of pace" on KPI / color only on category rows)
B > A × 0.9
AND B ≤ A      → Amber ("Watch spending" on KPI / color only on category rows)
B ≤ A × 0.9   → Green ("On track")
```

**Denominator by context:**

| Context | Denominator | Notes |
|---|---|---|
| Net/Health KPI | actual income | fallback to budgeted income if income = 0 |
| Expense categories | category budgeted | budgeted=0 + actual>0 → Red; both 0 → neutral |
| Income categories | category budgeted | Inverted: B < A → Amber, B ≥ A → Green |
| Income KPI badge | budgeted income | Shows `X% received`; green if B ≥ A, amber if < A |
| Expense KPI badge | budgeted expenses | Shows `X% used`; pace formula determines color |

**Formula is consistent regardless of day of month.** No grace periods.

**`monthProgress` must be passed from the page** — compute it once at the top of
`dashboard/page.tsx` using `computeMonthProgress(monthStart, today)` and pass it
down to all badge computations. Do not recompute it per-component.

**For historical months** (selected month in the past): `monthProgress = 1.0`.
This means the full month is evaluated — if a category ended over pace it stays red.

**For future months** (selected month in the future): `monthProgress = 0.0`.
All badges show neutral — no spending has occurred or is expected yet.

---

## Updated Commit Message

```
fix(EPIC-6): dashboard iteration — height-lock BVA, balance column, column renames, chart fix, spacing

- BVA table correctly height-locked to right column via ResizeObserver (useLayoutEffect)
- Progress bar moved inline to Progress column — outlined bar shows 100% reference
- Balance column added to all four account tiles (uses opening_balance from accounts)
- Interest rate shown as sub-label under account name when not null
- Debt tile: rename In→Paid, Paid→Spent
- Credit card tile: fix subtype='credit_card' RLS query; verify payment_source_account_id join
- Chart: maxBarThickness=32 prevents bar stretch on sparse data; pad to 6 month slots always
- Household Member card moved to middle panel; Month Context rows removed
- "Budget Set" logic: requires budgets row + at least one budget_line amount > 0
- KPI cards: horizontal layout (label+badge left, divider, value+sub right) — halves card height
- Health badge: replace ratio thresholds with pace formula (A=days elapsed/days in month, B=actual/denominator)

Stories: STORY-6.1, STORY-6.2, STORY-6.3, STORY-6.4, STORY-6.5, STORY-6.6, STORY-7.4
```

---

## Updated PR Description Addendum

**Append to the original PR description:**

---

### v2 iteration changes

**Layout:**
- BVA table height-lock now correctly implemented with `useLayoutEffect` + `ResizeObserver`
- Progress bar moved to dedicated inline column with outlined style (shows 100% reference)
- Global padding/gap reduction targeting single-viewport fit at 1080p

**Account tiles:**
- Balance column added to all four tiles — reads `opening_balance` from accounts table
- Interest rate displayed as muted sub-label under account name when present
- Debt tile columns renamed: In → Paid, Paid → Spent (clearer intent)

**Credit Cards tile:**
- Fixed `account_subtype = 'credit_card'` filter in RPC
- Verified `payment_source_account_id` (charges) and `linked_account_id` (payments) joins

**Chart:**
- `maxBarThickness: 32` applied to prevent bar stretch on sparse data
- Always renders 6 month slots — missing months padded with 0

**Middle panel:**
- Household Member card moved into middle panel
- Month Context rows removed (redundant with top-right month picker)

**"Budget Set" logic corrected:**
- Now requires `budgets` row + at least one `budget_lines.amount > 0`
- Empty budget no longer shows as "Yes"

---

## Notes for CC

1. **Migration B is confirmed applied.** Query `opening_balance` and `interest_rate`
   directly. No fallback migrations needed.

2. **Verify the credit card subtype value before deploying the RPC fix.** Run the
   diagnostic query in Change 7 first. Do not assume `'credit_card'` — confirm from data.

3. **ResizeObserver cleanup is mandatory.** Call `observer.disconnect()` in the
   `useLayoutEffect` cleanup function to prevent memory leaks on navigation.

4. **`buildSixMonthSlots` is a pure function — add a unit test for it** in
   `src/lib/dashboard/chartUtils.test.ts`. Test the edge cases: all 6 months present,
   only current month present, current month missing from trend data.

5. **Do not change the 3fr/2fr column split.** The layout proportions are confirmed
   correct. Only internal spacing changes are in scope.

6. **Opening balance is display-only.** Do not attempt to compute a running balance
   (opening + monthly in - monthly out) in v1. Display `opening_balance` as-is.
   Running balance computation is a future story.
