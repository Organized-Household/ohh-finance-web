# OHh Finance — Decision Log
**Maintained by:** Forge (Senior Full Stack Engineer, OHh Platform)
**Purpose:** Living record of business logic decisions, formulas, rationale, and rejected
alternatives. Attach this document at the start of every new session so Forge, Scribe,
and CC can resume without re-litigating past decisions.
**Last updated:** 2026-04-17

---

## How to use this document

- **Forge:** Read at session start. Append new decisions at session end.
- **Scribe:** Use as primary source for business logic documentation. Do not rely
  solely on the GitHub repo — implementation code does not capture rationale.
- **CC:** Read before implementing any feature touching the areas below. When in
  doubt about intended behaviour, this document takes precedence over assumptions.

---

## Platform & Stack Decisions

### Decision: Tech stack is fixed
**Date:** Pre-conversation (established in PDD/Engineering Spec)
**Decision:** Next.js (App Router) + TypeScript + Supabase (Postgres + Auth + RLS) + Vercel.
**Non-negotiable.** No separate backend services. No native mobile.

### Decision: Single tenant per user (MVP)
**Date:** Pre-conversation
**Decision:** MVP assumes one tenant per user. Tenant switching UI is out of scope.
Tenant context is always derived server-side from `tenant_members` — never from
client-provided input.

---

## Schema Decisions

### Decision: Unified `accounts` table
**Date:** Pre-conversation (Architect approved)
**Decision:** Single `accounts` table replaces former `savings_accounts`,
`investment_accounts`, `debt_accounts` tables.
**Fields:** `account_kind` (savings / investment / debt), `account_subtype` (e.g.
`credit_card`, `mortgage`, `RRSP`, `TFSA`), `is_active`.
**Rule:** Never reference old separate account tables in new work.

### Decision: Credit cards are a subtype of debt
**Date:** 2026-04-17
**Decision:** Credit card accounts are `account_kind = 'debt'` with
`account_subtype = 'credit_card'`. They are not a separate entity.
**Dashboard treatment:** Credit cards are surfaced separately from other debts on the
dashboard for visibility (revolving behaviour differs from loans/mortgages), but they
live in the same `accounts` table.
**RPC filter:** `WHERE account_kind = 'debt' AND account_subtype = 'credit_card'`.
**CC note:** Always verify the exact stored subtype string before deploying RPC filters.
Run: `SELECT DISTINCT account_subtype FROM accounts WHERE account_kind = 'debt';`

### Decision: `opening_balance` on `accounts`
**Date:** 2026-04-17
**Status:** Approved and applied to Supabase.
**Field:** `opening_balance NUMERIC(12,2) NULL`
**Purpose:** User-entered starting balance for display on account tiles.
**v1 scope:** Display only. Running balance computation
(`opening_balance + SUM(linked_in) - SUM(payment_source_out)`) is deferred to v2.
**Display rule:** If `opening_balance` is null, display `—`.
**Rejected alternative:** Computing running balance in v1 — deferred because interest
accrual tracking is not in scope, so the computed number would drift from reality.

### Decision: `interest_rate` on `accounts`
**Date:** 2026-04-17
**Status:** Approved and applied to Supabase.
**Field:** `interest_rate NUMERIC(5,4) NULL` (e.g. `0.0489` = 4.89%)
**Purpose:** Informational display only. No calculations run against this field in v1.
**Display rule:** Show as muted sub-label under account name (e.g. `4.89% p.a.`) only
when not null.
**Applies to:** All account kinds — savings, investment, debt.
**Note:** Investment and savings rates fluctuate; field stores last known/nominal rate.

### Decision: Signed amount convention
**Date:** Pre-conversation (Engineering Spec)
**Decision:** Income stored positive. Expenses, savings contributions, investment
contributions stored negative. Dashboard and RPC use `ABS()` before returning to UI.
**UI rule:** Frontend always receives positive numbers from the API. Do not apply
additional negation in components.

### Decision: `transaction_date` / `occurred_at` month boundary
**Date:** Pre-conversation (Engineering Spec)
**Decision:** Month window is `occurred_at >= month_start AND occurred_at < next_month_start`.
Inclusive start, exclusive end. `month_start` is always UTC first day of month (`YYYY-MM-01`).

---

## Transaction Decisions

### Decision: `payment_source_account_id` vs `linked_account_id`
**Date:** Pre-conversation
**Decision:**
- `linked_account_id` — the destination/target account (money going INTO an account).
  Example: savings deposit, investment contribution, credit card payment (paying down the card).
- `payment_source_account_id` — the source/payment method (money going OUT via an account).
  Example: expense charged to a credit card, mortgage payment from chequing.
**Critical:** These two FKs cannot reference the same account (DB constraint).

### Decision: Manual transactions default to `status = 'posted'`
**Date:** Pre-conversation (Engineering Spec)
**Decision:** Manually entered transactions are immediately posted.
CSV-imported transactions are `status = 'pending'` until user reviews and posts them.

---

## Dashboard Decisions

### Decision: Three-chart strip layout
**Date:** 2026-04-17
**Decision:** Chart area between KPI row and BVA table uses three charts in a
`3fr / 4fr / 3fr` grid:
- **Left (3fr):** Investment balance trend — single area line, 6-month window
- **Middle (4fr):** Income vs Expenses bar chart with net line — unchanged
- **Right (3fr):** Savings goals — grouped bar per savings account (target vs contributed all-time)
**Rejected alternatives:**
- Savings + Investments combined on one chart — scale gap makes one line flat
- Net worth trend — rejected because assets (property etc.) are not tracked, so net worth is incomplete
- Debt reduction trend — removed from chart strip; debt info is in the tile below

### Decision: Savings goals chart — "contributed all-time" not month-scoped
**Date:** 2026-04-17
**Decision:** The contributed bar on the savings goals chart shows total all-time
contributions (`SUM` of all posted `linked_account_id` transactions for the account,
across all time). Not filtered to selected month.
**Rationale:** The chart measures progress toward a goal, not monthly activity.
Monthly activity is already shown in the savings tile below.
**Exclusion rule:** Accounts without `target_amount` set are excluded from the chart.
If no accounts have targets, show empty state: "Set a target on your savings accounts
to track progress."

### Decision: Investment trend chart — v1 approximation
**Date:** 2026-04-17
**Decision:** Investment trend plots cumulative monthly contributions (sum of
`linked_account_id` transactions to investment accounts) as a proxy for balance growth.
**Rationale:** No balance history table exists in v1. Members update `opening_balance`
(current balance) on their accounts manually. A dedicated balance history table
is a future story.

### Decision: `opening_balance` UI label convention
**Date:** 2026-04-17
**Decision:** DB column stays `opening_balance`. UI labels are:
- Savings accounts → **"Current Balance"**
- Investment accounts → **"Current Balance"**
- Debt accounts → **"Balance Owed"**
- Credit card accounts → **"Balance Owed"**
**Rule:** Never show "Opening Balance" in the UI. The field name is an implementation
detail, not a user-facing concept.

### Decision: Dashboard tile and BVA header styling
**Date:** 2026-04-17
**Decision:** All tile title bars use pastel background with deep text from same
colour family. Column header bars use light grey (`#f1f5f9`) with bold 9px dark text.
Title bar must always visually outrank the column header bar.

| Tile | Title bar bg | Title text |
|---|---|---|
| Budget vs Actual | `#fef9c3` pastel yellow | `#854d0e` deep amber |
| Savings | `#d1fae5` pastel green | `#065f46` deep green |
| Investments | `#dbeafe` pastel blue | `#1e40af` deep blue |
| Debts | `#fee2e2` pastel red | `#991b1b` deep red |
| Credit Cards | `#ede9fe` pastel purple | `#5b21b6` deep purple |

**BVA gets pastel yellow** — deliberately distinct from all four account tiles.
**Date:** 2026-04-17
**Decision:** All dashboard sections are returned by a single `rpc_dashboard_summary(p_month_start)`
call. No N+1 queries. No client-side aggregation.
**Rationale:** Performance target is ≤2s. Single round trip with SQL GROUP BY keeps
this achievable at typical household data volumes.

### Decision: Dashboard layout (locked)
**Date:** 2026-04-17
**Layout:**
```
Row 1: [Middle panel] [KPI: Income] [KPI: Expenses] [KPI: Net/Health]
Row 2: [Income vs Expenses — 6-month chart strip]
Row 3: [Budget vs Actual — 60%] | [Savings tile  ]  (40%, stacked)
                                 | [Investments tile]
Row 4: [Debts tile — 50%] [Credit Cards tile — 50%]
```
**Column split:** 3fr / 2fr for Row 3. Do not change.
**Middle panel:** Contains Household Member card. Month Context rows removed (redundant
with top-right month picker).

### Decision: KPI card layout — horizontal
**Date:** 2026-04-17
**Decision:** KPI cards use horizontal layout: label + badge on left, thin divider,
large value + sub-text on right. Halves card height vs vertical stacking.
**Rationale:** Saves vertical space; goal is entire dashboard visible in one viewport
at 1080p without scrolling.

### Decision: Budget vs Actual table — height-locked and scrollable
**Date:** 2026-04-17
**Decision:** BVA table is height-locked to match the right column (Savings +
Investments stacked). Header row sticky. Totals row pinned outside scroll container.
Scrollable body only.
**Implementation:** `useLayoutEffect` + `ResizeObserver` on right column ref.
`observer.disconnect()` on cleanup mandatory.

### Decision: Progress bar in BVA table — outlined style
**Date:** 2026-04-17
**Decision:** Progress bar lives in a dedicated `Progress` column (inline, same row).
Bar has a visible outline border so users can see where 100% is even at 0% fill.
Filled portion slides in from left.
**Rejected alternative:** Progress bar below category name on its own line — caused
excessive row height.

### Decision: Debt tile column labels
**Date:** 2026-04-17
**Decision:**
- Column formerly "In" → renamed **"Paid"** (money paid toward the debt, reducing balance)
- Column formerly "Paid" → renamed **"Spent"** (money spent via the debt account)
**Rationale:** "Paid" implied the debt was being paid down. "Spent" correctly
describes charges accumulating on the account.

### Decision: Account tile columns by type
**Date:** 2026-04-17

| Tile | Columns |
|---|---|
| Savings | Account \| Balance \| In \| Out |
| Investments | Account \| Balance \| In \| Out |
| Debts | Account \| Balance \| Paid \| Spent |
| Credit Cards | Account \| Balance \| Charged \| Payment |

**Balance** = `opening_balance` from accounts table (display only, v1).

---

## Health Badge / Pace Formula

### Decision: Pace formula replaces simple ratio thresholds
**Date:** 2026-04-17
**Rejected alternative:** Simple `actual ÷ budgeted` ratio with fixed thresholds
(< 80% green, 80–100% amber, > 100% red). Rejected because it doesn't account for
where we are in the month — low spending early in the month isn't meaningful.

**Adopted formula:**
```
A = days elapsed in selected month ÷ total days in month
B = actual ÷ denominator (context-dependent, see below)

B > A           → Red   (spending ahead of pace)
B > A × 0.9
AND B ≤ A       → Amber (closing in — within 10% of pace threshold)
B ≤ A × 0.9    → Green (on track)
```

**Formula is consistent regardless of day of month.** No grace periods. No day-1
exceptions. If you spent on day 1, the formula evaluates it the same as day 15.

**Denominator by context:**

| Context | Denominator | Special cases |
|---|---|---|
| Net/Health KPI | actual income | fallback: budgeted income if income = 0 |
| Expense categories | category budgeted | budgeted=0 + actual>0 → Red; both 0 → neutral |
| Income categories | category budgeted | Inverted (see below) |
| Income KPI badge | budgeted income | Shows `X% received`; inverted logic |
| Expense KPI badge | budgeted expenses | Shows `X% used`; standard pace logic |

**Income categories — inverted logic:**
For income, we WANT the value to be ahead of pace (more income sooner is good).
`actual ÷ budgeted < A` → Amber (income coming in slower than expected)
`actual ÷ budgeted ≥ A` → Green (on track or ahead)

**Historical months** (selected month in the past): `A = 1.0`. Full month evaluated.
**Future months** (selected month in the future): `A = 0.0`. All badges neutral.

**`monthProgress` (A) computed once** at page level via `computeMonthProgress(monthStart, today)`
and passed to all badge computations. Not recomputed per-component.

### Decision: Health badge labels
**Date:** 2026-04-17

| Status | Net/Health KPI label | Category rows |
|---|---|---|
| Green | "On track" | Color only (no text label) |
| Amber | "Watch spending" | Color only |
| Red | "Ahead of pace" | Color only + category name turns red |
| Neutral | "No data" | No badge shown |

---

## Navigation / Sidebar Decisions

### Decision: Sidebar stays collapsed on nav item click
**Date:** 2026-04-17
**Decision:** Clicking a nav item navigates but does NOT expand the sidebar.
Only the toggle button (chevron) changes collapsed/expanded state.
Route changes must not trigger sidebar expansion.

### Decision: Menu structure (confirmed)
**Date:** 2026-04-17
**Order:**
1. Home
2. Categories
3. Budget
4. Transactions
5. (divider)
6. Accounts (collapsible group)
   - Savings
   - Investments
   - Debts

"Accounts" is a group label, not a navigation link. Sub-items are indented.
Group starts expanded if any sub-route is active.
In collapsed sidebar, show single Accounts icon defaulting to Savings.

---

## Account Page Field Decisions

### Decision: Current Balance label and storage
**Date:** 2026-04-17
**DB column:** `opening_balance` — name stays as-is in DB
**UI label:** "Current Balance" for Savings and Investments
**UI label:** "Current Balance Owed" for Debts
**Display:** `$X,XXX.XX` or `—` if null
**v1 scope:** Display only. No running balance computation.

### Decision: Interest Rate storage convention
**Date:** 2026-04-17
**User enters:** `4.89` (percent)
**Stored in DB:** `0.0489` (divide by 100 on save)
**Displayed as:** `4.89%` (multiply by 100 for display)
**Applies to:** All account kinds — savings, investment, debt

### Decision: Investment account subtype — dropdown values
**Date:** 2026-04-17
**Canonical values (stored lowercase):**
`rrsp`, `tfsa`, `stocks`, `etf`, `gic`, `pension`, `gsop`, `rpp`, `other`
**Migration:** Normalise existing free-text values to lowercase via migration.
**Display labels:** RRSP, TFSA, Stocks, ETF, GIC, Pension, GSOP, RPP, Other

### Decision: Savings account fields (complete list)
**Date:** 2026-04-17
Fields: Purpose (name), Account # last4 (optional), Current Balance (optional),
Interest Rate % (optional), Target Amount (optional), Target Date (optional)

### Decision: Investments account fields (complete list)
**Date:** 2026-04-17
Fields: Name, Type (dropdown), Current Balance (optional), Interest Rate % (optional)

### Decision: Debts account fields (complete list)
**Date:** 2026-04-17
Fields: Name, Type (dropdown — credit_card/mortgage/heloc/car_loan/personal_loan/other),
Current Balance Owed (optional), Interest Rate % (optional)

### Decision: Definition of "Budget Set = Yes"
**Date:** 2026-04-17
**Decision:** Budget is considered set for a month when:
1. A `budgets` row exists for `(tenant_id, month_start)`, AND
2. At least one `budget_lines` row for that budget has `amount > 0`
**Rejected definition:** Existence of `budgets` row alone — an empty budget
(all lines = 0) would show "Yes" which is misleading.
**SQL:**
```sql
EXISTS (
  SELECT 1 FROM budgets b
  JOIN budget_lines bl ON bl.budget_id = b.id
  WHERE b.tenant_id = v_tenant_id
    AND b.month_start = p_month_start
    AND bl.amount > 0
)
```

### Future story: Explicit budget confirmation (not yet scheduled)
**Date noted:** 2026-04-17
**Concept:** Admin explicitly marks a month's budget as confirmed/locked. Triggers
a visual indicator ("Budget confirmed by [name] on [date]"). Non-admins can see but
not confirm. Replaces derived logic with intentional human action.
**Proposed schema:** `confirmed_at TIMESTAMPTZ NULL` and `confirmed_by UUID NULL`
on `budgets` table. Requires Architect approval before implementation.
**Rationale noted by product owner:** "Forces heads of family to have this exercise.
Good for the couple."

---

## 6-Month Income vs Expenses Chart

### Decision: Chart always renders 6 month slots
**Date:** 2026-04-17
**Decision:** Chart always shows 6 months on x-axis regardless of how much data
exists. Months with no data are padded with 0 values.
**Rationale:** Prevents bar stretch (Chart.js balloons bars when few data points).
**Implementation:** `buildSixMonthSlots(trend, currentMonthStart)` utility in
`src/lib/dashboard/chartUtils.ts`.

### Decision: Current month labeled with asterisk
**Date:** 2026-04-17
**Decision:** Current (partial) month label appended with `*` (e.g. `Apr*`) to signal
to users that the month is not complete.

### Decision: `maxBarThickness: 32`
**Date:** 2026-04-17
**Decision:** Chart.js `maxBarThickness` set to 32px on both Income and Expenses
datasets to prevent bars stretching on sparse data.

---

## CSV Import Decisions

### Decision: Imported transactions stay pending until explicitly posted
**Date:** Pre-conversation (Engineering Spec)
**Decision:** Even if auto-categorized, imported transactions remain `status = 'pending'`
until user reviews and posts them in the review UI.
**Rationale:** Forces user review. Auto-categorization can be wrong.

### Decision: No deduplication in MVP
**Date:** Pre-conversation
**Decision:** Duplicate imports are possible in MVP. Optional `import_fingerprint`
field can be added later if needed.

---

## Out of Scope (do not implement without new Architect approval)

- Bank/credit card API integrations (Plaid, Open Banking, etc.)
- Running balance computation with interest accrual
- Automated financial advice
- Native mobile app
- Data export / portability features
- Tenant switching UI
- Full CRUD UI for categorization rules (MVP uses seeded rules + fallback matching)
