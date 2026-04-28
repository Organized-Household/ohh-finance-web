import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import DashboardMonthSelector from "@/components/dashboard/dashboard-month-selector";
import KpiCard from "@/components/dashboard/KpiCard";
import ChartStrip from "@/components/dashboard/ChartStrip";
import DashboardBvaRow from "@/components/dashboard/DashboardBvaRow";
import AccountTile from "@/components/dashboard/AccountTile";
import CombinedDebtsTile from "@/components/dashboard/CombinedDebtsTile";
import CreditCardsTile from "@/components/dashboard/CreditCardsTile";
import MemberSelectorCard from "@/components/layout/MemberSelectorCard";
import { createClient } from "@/lib/supabase/server";
import { formatMonthStartDate } from "@/lib/db/month";
import { getDashboardMonth } from "@/lib/dashboard/get-dashboard-month";
import { getDashboardSummary } from "@/lib/dashboard/get-dashboard-summary";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  computeMonthProgress,
  computeIncomeBadge,
  computeExpenseBadge,
  computeNetHealthBadge,
} from "@/lib/dashboard/healthBadge";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const resolvedMonth = getDashboardMonth(params);
  const monthStartIso = formatMonthStartDate(resolvedMonth.monthStart);
  const selectedMonth = resolvedMonth.monthParam;

  // monthProgress: A = days elapsed ÷ days in month
  const monthProgress = computeMonthProgress(resolvedMonth.monthStart, new Date());

  const supabase = await createClient();
  const [
    { data: { user }, error: userError },
    membership,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getCurrentTenantMembership(),
  ]);

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const isAdmin = membership.role === "admin";
  // Server enforces: members always see own data regardless of URL param
  const memberParam = typeof params.member === "string" ? params.member : undefined;
  const activeMemberId = isAdmin ? (memberParam ?? user.id) : user.id;

  const summary = await getDashboardSummary(monthStartIso, activeMemberId);

  // KPI badges — all pace-based
  const incomeBadge = computeIncomeBadge(
    summary.income_total,
    summary.budgeted_income,
    monthProgress
  );
  const expenseBadge = computeExpenseBadge(
    summary.expense_total,
    summary.budgeted_expense,
    monthProgress
  );
  const netBadge = computeNetHealthBadge({
    incomeActual: summary.income_total,
    incomeBudgeted: summary.budgeted_income,
    expenseActual: summary.expense_total,
    expenseBudgeted: summary.budgeted_expense,
    monthProgress,
  });

  const netAmount = summary.income_total - summary.expense_total;

  // Left panel: member selector + household status stats
  const leftPanelSections: WorkspaceLeftPanelSection[] = [
    {
      title: "Household Member",
      content: (
        <MemberSelectorCard
          isAdmin={isAdmin}
          currentUserId={user.id}
          activeMemberId={activeMemberId}
        />
      ),
    },
    {
      title: "Household Status",
      content: (
        <div className="rounded-lg border border-slate-300 bg-white px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Pending review</span>
            <span
              className={`text-[13px] font-semibold tabular-nums ${
                summary.pending_review_count > 0
                  ? "text-amber-600"
                  : "text-slate-400"
              }`}
            >
              {summary.pending_review_count > 0
                ? summary.pending_review_count
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Budget set</span>
            {summary.budget_is_set ? (
              <span className="text-[13px] font-semibold text-emerald-600">
                Yes
              </span>
            ) : (
              <span className="text-[13px] font-semibold text-rose-600">
                No
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Last import</span>
            <span className="text-[13px] tabular-nums text-slate-600">
              {summary.last_transaction_date ?? "—"}
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="Dashboard"
      description="Monthly financial overview."
      leftPanelSections={leftPanelSections}
      topbarControls={<DashboardMonthSelector selectedMonth={selectedMonth} />}
      isAdmin={isAdmin}
      currentUserId={user.id}
      activeMemberId={activeMemberId}
    >
      {/*
        Viewport-fill layout — flex column, height:100% fills <main> content area.
        WorkspaceShell uses h-screen + gridTemplateRows:1fr so <main> has a
        defined height; height:100% here then propagates down to each row.

        Row 1 — KPIs:     flexShrink:0 — natural height
        Row 2 — Charts:   flexShrink:0 — natural height
        Row 3 — BVA+Sav:  flex:1 + minHeight:0 — takes ALL remaining space
        Row 4 — Tiles:    flexShrink:0, height:220px — fixed, adjust to taste
      */}
      <div className="flex flex-col gap-3" style={{ minHeight: '100%' }}>

        {/* Row 1: 3 KPI cards — stacked on mobile, side-by-side on sm+ */}
        <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3">
          <KpiCard
            label="Income"
            value={formatCurrency(summary.income_total)}
            sub={`of ${formatCurrency(summary.budgeted_income)} budgeted`}
            badge={incomeBadge}
            valueColor="income"
          />
          <KpiCard
            label="Expenses"
            value={formatCurrency(summary.expense_total)}
            sub={`of ${formatCurrency(summary.budgeted_expense)} budgeted`}
            badge={expenseBadge}
            valueColor="expense"
          />
          <KpiCard
            label="Net / Health"
            value={formatCurrency(netAmount)}
            sub={netAmount >= 0 ? "surplus this month" : "deficit this month"}
            badge={netBadge}
            valueColor={netAmount >= 0 ? "income" : "expense"}
          />
        </div>

        {/* Row 2: Three-chart strip */}
        <div style={{ flexShrink: 0 }}>
          <ChartStrip
            investmentTrend={summary.investment_trend}
            trend={summary.monthly_trend}
            savingsGoals={summary.savings_goals}
            currentMonthStart={monthStartIso}
          />
        </div>

        {/* Row 3: BVA (3fr) + Savings (2fr) — DashboardBvaRow has flex:1 minHeight:0 */}
        <DashboardBvaRow
          bvaRows={summary.budget_vs_actual ?? []}
          savingsAccounts={summary.savings_accounts ?? []}
          monthProgress={monthProgress}
        />

        {/* Row 4: Three equal bottom tiles — stacked mobile → 2-col md → 3-col lg (fixed height on lg+) */}
        <div className="grid shrink-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:h-[220px]">
          <AccountTile
            kind="investment"
            accounts={summary.investment_accounts ?? []}
            fillHeight
          />
          <CombinedDebtsTile
            debtAccounts={summary.debt_accounts ?? []}
            creditCardAccounts={summary.credit_card_accounts ?? []}
          />
          <CreditCardsTile
            accounts={summary.credit_card_accounts ?? []}
          />
        </div>

      </div>
    </WorkspaceShell>
  );
}
