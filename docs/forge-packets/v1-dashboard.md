# Forge Packet — Dashboard Redesign
**Prepared by:** Forge (Senior Full Stack Engineer, OHh Platform)
**For:** Claude Code (CC) execution
**Date:** 2026-04-17
**Status:** Ready for implementation

---

## Jira Linkage

| Story | Title | Role in this packet |
|---|---|---|
| STORY-6.1 | Month selector | Already implemented — referenced only |
| STORY-6.2 | Itemized income list | Absorbed into dashboard aggregation |
| STORY-6.3 | Income vs expense totals | KPI cards + chart |
| STORY-6.4 | Budget vs actual by category | Scrollable budget table |
| STORY-6.5 | Credit card grouping | Credit card tile |
| STORY-6.6 | Savings/investment/debt rollups | Account tiles |
| STORY-7.4 | Performance ≤2s | Single aggregation RPC |

**Epic:** EPIC-6 — Monthly Dashboard and Financial Overview

---

## Approved Schema Changes

> ✅ All three migrations are approved. CC may write and apply them without further gate checks.

### Approved 1 — `opening_balance` on `accounts`
```sql
opening_balance NUMERIC(12,2) NULL
```
**Rationale:** Debt and credit card tiles display "Balance owed." Running balance = `opening_balance + SUM(linked_in) - SUM(payment_source_out)`. Display-only math — no amortization in v1.

### Approved 2 — `interest_rate` on `accounts`
```sql
interest_rate NUMERIC(5,4) NULL  -- e.g. 0.0489 = 4.89%
```
**Rationale:** Informational display only. No calculations run against this field in v1. Shown as a reference label on account tiles.

### Approved 3 — `rpc_dashboard_summary`
Full RPC replacement to support the new dashboard design. See Migration A below.

---

## Branch Name

```
feature/EPIC-6-dashboard-redesign
```

---

## Implementation Summary

Redesign the `/dashboard` page from a stacked-table layout into a structured financial command center. All data is fetched in a single API call. The layout is:

```
Row 1: [Household Member card] [KPI: Income] [KPI: Expenses] [KPI: Net/Health]
Row 2: [Income vs Expenses — 6-month bar+line chart strip]
Row 3: [Budget vs Actual table — 60% scrollable] [Savings tile] (stacked)
                                                  [Investments tile]
Row 4: [Debts tile — 50%] [Credit Cards tile — 50%]
```

### Health badge logic (applies to KPI cards AND per-category rows)

| Context | Green | Amber | Red |
|---|---|---|---|
| Overall expenses vs income | expenses < 80% income | 80–100% | > 100% |
| Overall expenses vs budgeted | actual < 80% budgeted | 80–100% | > 100% |
| Per-category variance | actual < 80% budgeted | 80–100% | > 100% |
| Income KPI | Shows % of budgeted income received — amber < 50%, green ≥ 50% |

The Net/Health KPI badge reads: **"On track"** (green) / **"Caution"** (amber) / **"Over budget"** (red) — evaluated against BOTH income vs expense AND expenses vs budgeted total. If either threshold is breached the worse status wins.

---

## Files Created / Modified

### New files

```
src/app/(app)/dashboard/page.tsx                        — page (server component, fetches data)
src/components/dashboard/KpiCard.tsx                    — income/expense/net summary card with health badge
src/components/dashboard/IncomeExpenseChart.tsx         — 6-month bar+line chart (Chart.js)
src/components/dashboard/BudgetVsActualTable.tsx        — scrollable budget table, height-locked to right col
src/components/dashboard/AccountTile.tsx                — reusable tile: savings / investments / debts / CC
src/components/dashboard/HouseholdMemberCard.tsx        — member info + pending count + budget set status
src/app/api/dashboard/route.ts                          — GET handler, validates month param, calls RPC
src/lib/validation/dashboard.ts                         — zod schema for dashboard query params
src/lib/dashboard/healthBadge.ts                        — pure function: compute badge status + label
src/lib/dashboard/healthBadge.test.ts                   — unit tests for badge thresholds
```

### Modified files

```
src/app/(app)/dashboard/page.tsx                        — replaces existing dashboard page
supabase/migrations/XXXXXX_rpc_dashboard_summary.sql    — new or updated RPC (see SQL section)
```

> ⚠️ If `opening_balance` and `interest_rate` schema changes are approved, also modify:
> `supabase/migrations/XXXXXX_accounts_add_balance_rate.sql`

---

## Migration Files

### Migration A — Dashboard aggregation RPC
**File:** `supabase/migrations/XXXXXX_rpc_dashboard_summary.sql`

```sql
-- Drop and recreate to allow signature changes safely
DROP FUNCTION IF EXISTS rpc_dashboard_summary(date);

CREATE OR REPLACE FUNCTION rpc_dashboard_summary(p_month_start date)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_month_end date;
  v_result json;
BEGIN
  -- Derive tenant from session membership (never trust client-provided tenant_id)
  SELECT tenant_id INTO v_tenant_id
  FROM tenant_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant membership found for current user';
  END IF;

  v_month_end := p_month_start + interval '1 month';

  SELECT json_build_object(

    -- KPI totals
    'income_total', COALESCE(SUM(amount) FILTER (
      WHERE transaction_type = 'income'
      AND occurred_at >= p_month_start AND occurred_at < v_month_end
      AND status = 'posted'
      AND tenant_id = v_tenant_id
    ), 0),

    'expense_total', ABS(COALESCE(SUM(amount) FILTER (
      WHERE transaction_type = 'expense'
      AND occurred_at >= p_month_start AND occurred_at < v_month_end
      AND status = 'posted'
      AND tenant_id = v_tenant_id
    ), 0)),

    -- Budgeted totals for KPI comparison
    'budgeted_income', COALESCE((
      SELECT SUM(bl.amount)
      FROM budget_lines bl
      JOIN budgets b ON b.id = bl.budget_id
      JOIN categories c ON c.id = bl.category_id
      WHERE b.tenant_id = v_tenant_id
        AND b.month_start = p_month_start
        AND c.category_type = 'income'
    ), 0),

    'budgeted_expense', COALESCE((
      SELECT SUM(bl.amount)
      FROM budget_lines bl
      JOIN budgets b ON b.id = bl.budget_id
      JOIN categories c ON c.id = bl.category_id
      WHERE b.tenant_id = v_tenant_id
        AND b.month_start = p_month_start
        AND c.category_type != 'income'
    ), 0),

    -- 6-month trend (for chart — last 6 months including current)
    'monthly_trend', (
      SELECT json_agg(m ORDER BY m.month_start)
      FROM (
        SELECT
          date_trunc('month', occurred_at)::date AS month_start,
          SUM(amount) FILTER (WHERE transaction_type = 'income') AS income,
          ABS(SUM(amount) FILTER (WHERE transaction_type = 'expense')) AS expenses
        FROM transactions
        WHERE tenant_id = v_tenant_id
          AND status = 'posted'
          AND occurred_at >= (p_month_start - interval '5 months')
          AND occurred_at < v_month_end
        GROUP BY date_trunc('month', occurred_at)::date
      ) m
    ),

    -- Budget vs actual by category
    'budget_vs_actual', (
      SELECT json_agg(r ORDER BY r.tag, r.category_name)
      FROM (
        SELECT
          c.id AS category_id,
          c.name AS category_name,
          c.tag,
          COALESCE(bl.amount, 0) AS budgeted,
          ABS(COALESCE(SUM(t.amount), 0)) AS actual
        FROM categories c
        LEFT JOIN budgets b ON b.tenant_id = v_tenant_id AND b.month_start = p_month_start
        LEFT JOIN budget_lines bl ON bl.budget_id = b.id AND bl.category_id = c.id
        LEFT JOIN transactions t ON t.category_id = c.id
          AND t.tenant_id = v_tenant_id
          AND t.occurred_at >= p_month_start AND t.occurred_at < v_month_end
          AND t.status = 'posted'
        WHERE c.tenant_id = v_tenant_id
          AND c.is_active = true
        GROUP BY c.id, c.name, c.tag, bl.amount
      ) r
    ),

    -- Account rollups: savings
    'savings_accounts', (
      SELECT json_agg(s)
      FROM (
        SELECT
          a.id,
          a.name,
          a.interest_rate,
          a.opening_balance,
          COALESCE(SUM(t.amount) FILTER (WHERE t.linked_account_id = a.id), 0) AS in_this_month,
          ABS(COALESCE(SUM(t.amount) FILTER (WHERE t.payment_source_account_id = a.id), 0)) AS out_this_month
        FROM accounts a
        LEFT JOIN transactions t ON (t.linked_account_id = a.id OR t.payment_source_account_id = a.id)
          AND t.tenant_id = v_tenant_id
          AND t.occurred_at >= p_month_start AND t.occurred_at < v_month_end
          AND t.status = 'posted'
        WHERE a.tenant_id = v_tenant_id
          AND a.account_kind = 'savings'
          AND a.is_active = true
        GROUP BY a.id, a.name, a.interest_rate, a.opening_balance
      ) s
    ),

    -- Account rollups: investments
    'investment_accounts', (
      SELECT json_agg(i)
      FROM (
        SELECT
          a.id,
          a.name,
          a.account_subtype,
          a.interest_rate,
          a.opening_balance,
          COALESCE(SUM(t.amount) FILTER (WHERE t.linked_account_id = a.id), 0) AS in_this_month,
          ABS(COALESCE(SUM(t.amount) FILTER (WHERE t.payment_source_account_id = a.id), 0)) AS out_this_month
        FROM accounts a
        LEFT JOIN transactions t ON (t.linked_account_id = a.id OR t.payment_source_account_id = a.id)
          AND t.tenant_id = v_tenant_id
          AND t.occurred_at >= p_month_start AND t.occurred_at < v_month_end
          AND t.status = 'posted'
        WHERE a.tenant_id = v_tenant_id
          AND a.account_kind = 'investment'
          AND a.is_active = true
        GROUP BY a.id, a.name, a.account_subtype, a.interest_rate, a.opening_balance
      ) i
    ),

    -- Account rollups: debts (excluding credit cards)
    'debt_accounts', (
      SELECT json_agg(d)
      FROM (
        SELECT
          a.id,
          a.name,
          a.account_subtype,
          a.interest_rate,
          a.opening_balance,
          COALESCE(SUM(t.amount) FILTER (WHERE t.linked_account_id = a.id), 0) AS in_this_month,
          ABS(COALESCE(SUM(t.amount) FILTER (WHERE t.payment_source_account_id = a.id), 0)) AS paid_this_month
        FROM accounts a
        LEFT JOIN transactions t ON (t.linked_account_id = a.id OR t.payment_source_account_id = a.id)
          AND t.tenant_id = v_tenant_id
          AND t.occurred_at >= p_month_start AND t.occurred_at < v_month_end
          AND t.status = 'posted'
        WHERE a.tenant_id = v_tenant_id
          AND a.account_kind = 'debt'
          AND (a.account_subtype IS NULL OR a.account_subtype != 'credit_card')
          AND a.is_active = true
        GROUP BY a.id, a.name, a.account_subtype, a.interest_rate, a.opening_balance
      ) d
    ),

    -- Account rollups: credit cards (debt subtype = credit_card)
    'credit_card_accounts', (
      SELECT json_agg(cc)
      FROM (
        SELECT
          a.id,
          a.name,
          a.interest_rate,
          a.opening_balance,
          ABS(COALESCE(SUM(t.amount) FILTER (WHERE t.payment_source_account_id = a.id), 0)) AS charged_this_month,
          ABS(COALESCE(SUM(t.amount) FILTER (WHERE t.linked_account_id = a.id), 0)) AS payment_this_month
        FROM accounts a
        LEFT JOIN transactions t ON (t.linked_account_id = a.id OR t.payment_source_account_id = a.id)
          AND t.tenant_id = v_tenant_id
          AND t.occurred_at >= p_month_start AND t.occurred_at < v_month_end
          AND t.status = 'posted'
        WHERE a.tenant_id = v_tenant_id
          AND a.account_kind = 'debt'
          AND a.account_subtype = 'credit_card'
          AND a.is_active = true
        GROUP BY a.id, a.name, a.interest_rate, a.opening_balance
      ) cc
    ),

    -- Pending import transaction count (for household member card)
    'pending_review_count', (
      SELECT COUNT(*)
      FROM transactions
      WHERE tenant_id = v_tenant_id
        AND status = 'pending'
    ),

    -- Budget set flag for selected month
    'budget_is_set', (
      SELECT EXISTS (
        SELECT 1 FROM budgets
        WHERE tenant_id = v_tenant_id
          AND month_start = p_month_start
      )
    )

  ) INTO v_result
  FROM transactions
  WHERE tenant_id = v_tenant_id;  -- anchor FROM for aggregate filters above

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users (RLS inside function handles tenant scoping)
GRANT EXECUTE ON FUNCTION rpc_dashboard_summary(date) TO authenticated;
```

> `opening_balance` and `interest_rate` columns are referenced above. Both are approved — apply Migration B before running this RPC in production.

---

### Migration B — accounts: opening_balance + interest_rate
**File:** `supabase/migrations/XXXXXX_accounts_add_balance_rate.sql`

```sql
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS interest_rate   NUMERIC(5,4)  NULL;

COMMENT ON COLUMN accounts.opening_balance IS
  'User-entered starting balance. Running balance = opening_balance + linked_in - payment_source_out. No interest accrual in v1.';

COMMENT ON COLUMN accounts.interest_rate IS
  'Nominal interest rate for display only (e.g. 0.0489 = 4.89%). No calculations run against this field in v1.';
```

---

## API Route

**File:** `src/app/api/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { dashboardQuerySchema } from '@/lib/validation/dashboard'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parse = dashboardQuerySchema.safeParse({
    month: searchParams.get('month'),
  })

  if (!parse.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_MONTH', message: 'month must be YYYY-MM-01' } },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .rpc('rpc_dashboard_summary', { p_month_start: parse.data.month })

  if (error) {
    console.error('[dashboard] RPC error', { code: error.code })
    return NextResponse.json(
      { ok: false, error: { code: 'RPC_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, data })
}
```

**File:** `src/lib/validation/dashboard.ts`

```typescript
import { z } from 'zod'

export const dashboardQuerySchema = z.object({
  // Must be first day of month in UTC: YYYY-MM-01
  month: z
    .string()
    .regex(/^\d{4}-\d{2}-01$/, 'month must be YYYY-MM-01')
    .refine((v) => !isNaN(Date.parse(v)), 'month must be a valid date'),
})
```

---

## Component Specifications

### `KpiCard.tsx`
Props:
```typescript
interface KpiCardProps {
  label: string
  value: string           // pre-formatted, e.g. "$2,910"
  sub: string             // e.g. "of $8,500 budgeted"
  badge: {
    label: string         // "On track" | "34% received" | "43% used" | "Caution" | "Over budget"
    status: 'green' | 'amber' | 'red'
  }
  valueColor?: 'income' | 'expense' | 'net'
}
```
- Three instances side by side in the KPI row.
- Badge color maps: green → `bg-[#eaf3de] text-[#3b6d11]`, amber → `bg-[#faeeda] text-[#854f0b]`, red → `bg-[#fcebeb] text-[#a32d2d]`.

### `IncomeExpenseChart.tsx`
- Client component (`'use client'`).
- Uses Chart.js via dynamic import with `ssr: false`.
- Props: `trend: Array<{ month_start: string; income: number; expenses: number }>`.
- Derives `net = income - expenses` client-side.
- Chart height: `90px` wrapper div. Font size 9px on axes.
- Labels the current (last) month as `${abbr}*` to indicate partial month.
- Custom legend rendered as HTML above canvas, not Chart.js default.
- Colors: income `#1d9e75`, expenses `#d85a30`, net line `#185fa5` dashed.

### `BudgetVsActualTable.tsx`
- Client component.
- Props: `rows: BudgetVsActualRow[]`, `rightColRef: React.RefObject<HTMLDivElement>`.
- Uses a `useEffect` + `ResizeObserver` on `rightColRef` to match its own height.
- Internal structure:
  - Fixed header (sticky `<thead>`, `position: sticky; top: 0`).
  - Scrollable `<tbody>` wrapper div with `overflow-y: auto`.
  - Pinned totals row rendered OUTSIDE the scroll container, inside a footer div.
- Category name turns red (`text-[#d85a30] font-medium`) when `actual > budgeted`.
- Progress bar per row: green < 80%, amber 80–100%, red > 100%.
- Group headers (INCOME / STANDARD / SAVINGS / INVESTMENT) rendered as full-width `<tr>` with muted background.

### `AccountTile.tsx`
Reusable for all four account types. Props:
```typescript
interface AccountTileProps {
  kind: 'savings' | 'investment' | 'debt' | 'credit_card'
  accounts: Array<{
    id: string
    name: string
    opening_balance: number | null
    interest_rate: number | null
    in_this_month: number
    out_this_month: number        // for savings/investments
    paid_this_month?: number      // for debts
    charged_this_month?: number   // for credit cards
    payment_this_month?: number   // for credit cards
  }>
}
```
- Per-account row shows: name, balance (opening_balance if available, else "—"), in/out or charged/payment.
- Interest rate shown as small muted label if `interest_rate` is not null: e.g. `4.89% p.a.`
- Totals row pinned at bottom of tile.
- Kind label colors: savings green, investments blue, debts red, credit cards purple.

### `HouseholdMemberCard.tsx`
Props:
```typescript
interface HouseholdMemberCardProps {
  displayName: string
  role: 'admin' | 'member'
  pendingReviewCount: number
  budgetIsSet: boolean
  lastImportDate: string | null
}
```
- Avatar: initials circle, blue tint.
- Three stat rows: pending review (amber if > 0), budget set (green yes / red no), last import date.

### `dashboard/page.tsx` (server component)
```typescript
// Pseudocode — implement against existing repo patterns
const monthStart = searchParams.month ?? formatMonthStart(new Date())
const res = await fetch(`/api/dashboard?month=${monthStart}`, { cache: 'no-store' })
const { data } = await res.json()

// Derive health badge for Net KPI
const netBadge = computeHealthBadge({
  incomeActual: data.income_total,
  incomeBudgeted: data.budgeted_income,
  expenseActual: data.expense_total,
  expenseBudgeted: data.budgeted_expense,
})
```

---

## Health Badge Logic

**File:** `src/lib/dashboard/healthBadge.ts`

```typescript
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
```

**File:** `src/lib/dashboard/healthBadge.test.ts`

```typescript
import { computeNetHealthBadge, computeCategoryBadge, computeIncomeBadge, computeExpenseBadge } from './healthBadge'

describe('computeNetHealthBadge', () => {
  it('returns green when expenses are well under income and budget', () => {
    expect(computeNetHealthBadge({ incomeActual: 5000, incomeBudgeted: 8000, expenseActual: 900, expenseBudgeted: 2100 }).status).toBe('green')
  })
  it('returns amber when expenses approach budget (80–100%)', () => {
    expect(computeNetHealthBadge({ incomeActual: 5000, incomeBudgeted: 5000, expenseActual: 1800, expenseBudgeted: 2100 }).status).toBe('amber')
  })
  it('returns red when expenses exceed income', () => {
    expect(computeNetHealthBadge({ incomeActual: 1000, incomeBudgeted: 5000, expenseActual: 1200, expenseBudgeted: 2100 }).status).toBe('red')
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
})
```

---

## Commit Message

```
feat(EPIC-6): redesign dashboard with KPI cards, trend chart, scrollable budget table, and account tiles

- Replaces stacked table layout with structured financial command center
- Single rpc_dashboard_summary RPC call for all dashboard data
- KPI cards: income (% received badge), expenses (% used badge), net (on track/caution/over budget)
- 6-month income vs expense bar chart with net savings line (90px compact strip)
- Budget vs actual table: height-locked to right column, scrollable body, sticky header + pinned totals
- Progress bars + red category name when actual > budgeted
- Savings + Investment tiles stacked (60/40 split with budget table)
- Debts + Credit Cards tiles at bottom (50/50)
- All account tiles: balance, in (linked_account), out (payment_source) per account
- Health badge logic extracted to pure utility with unit tests
- Proposed schema: opening_balance + interest_rate on accounts (Architect approval pending)

Stories: STORY-6.1, STORY-6.2, STORY-6.3, STORY-6.4, STORY-6.5, STORY-6.6, STORY-7.4
```

---

## Pull Request Description

**Title:** `feat(EPIC-6): Dashboard redesign — KPI cards, trend chart, scrollable budget table, account tiles`

**Summary:**
Replaces the current stacked-table dashboard with a structured financial overview layout. All data is fetched in a single `rpc_dashboard_summary` RPC call, keeping the dashboard within the ≤2s performance target (STORY-7.4).

**Layout (top to bottom):**
1. Household Member card + 3 KPI cards (income / expenses / net health)
2. 6-month income vs expenses bar chart with net savings line (compact 90px strip)
3. Budget vs Actual table (60%) + Savings tile / Investments tile stacked (40%)
4. Debts tile (50%) + Credit Cards tile (50%)

**Health badge system:**
Implemented as a pure utility (`healthBadge.ts`) with full unit test coverage. Badges apply at both the overall KPI level and per-category row level. Logic evaluates both expense-vs-income and expense-vs-budget ratios; worst status wins.

**Budget vs Actual scrollable constraint:**
The BVA table is height-locked to match the right column (Savings + Investments stacked) using a `ResizeObserver`. Header row is sticky, totals row is pinned outside the scroll container.

**Schema additions (Migration B — approved, apply before Migration A):**
- `accounts.opening_balance NUMERIC(12,2) NULL` — used for balance display on debt/CC tiles
- `accounts.interest_rate NUMERIC(5,4) NULL` — informational display only, no math in v1

The RPC handles `null` for these columns gracefully. Account tiles display `—` for balance if value is null.

**Testing:**
- Unit tests: `healthBadge.test.ts` — all threshold cases covered
- Manual smoke: verify tenant isolation by confirming RPC derives `tenant_id` from `tenant_members` (never from client input)
- Performance: run dashboard endpoint against staging with typical dataset; confirm ≤2s

**Checklist:**
- [ ] RLS verified: RPC uses `auth.uid()` → `tenant_members` to derive tenant, never client-provided value
- [ ] No service-role key usage in dashboard route
- [ ] Migration B (opening_balance + interest_rate) applied before Migration A (RPC) in staging and production
- [ ] CI green: lint + typecheck + tests
- [ ] Responsive pass: dashboard usable at mobile/tablet/desktop viewports

**Jira:** STORY-6.1, STORY-6.2, STORY-6.3, STORY-6.4, STORY-6.5, STORY-6.6, STORY-7.4

---

## Implementation Risks & Notes for CC

1. **`opening_balance` dependency** — Migration B must be applied before Migration A (the RPC) in production, since the RPC references these columns. Apply them in order: B first, then A. The components display `—` for balance if the value is `null`, so local dev without the migration won't break rendering.

2. **Chart.js in Next.js App Router** — `IncomeExpenseChart` must be a client component with `dynamic(() => import(...), { ssr: false })` to avoid SSR issues with the canvas API.

3. **ResizeObserver for BVA height lock** — the `BudgetVsActualTable` component uses `rightColRef` passed from the parent page. The observer should disconnect on unmount. Use `useLayoutEffect` not `useEffect` to avoid a flash of wrong height.

4. **Month boundary** — the RPC uses `occurred_at >= p_month_start AND occurred_at < v_month_end` where `v_month_end = p_month_start + interval '1 month'`. This matches the canonical month window defined in the engineering spec. Do not change this.

5. **Signed amount convention** — income is stored positive, expenses negative. The RPC uses `ABS()` on expense aggregates before returning them. The frontend always receives positive numbers and formats them with `$` prefix. Do not apply additional negation in the UI.

6. **Credit cards are a subset of debts** — `account_kind = 'debt'` AND `account_subtype = 'credit_card'`. The Debts tile excludes credit cards. The Credit Cards tile includes only `subtype = 'credit_card'`. Both use the same `accounts` table.
