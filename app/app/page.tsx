import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import DashboardMonthSelector from "@/components/dashboard/dashboard-month-selector";
import KpiCard from "@/components/dashboard/KpiCard";
import IncomeExpenseChart from "@/components/dashboard/IncomeExpenseChart";
import BudgetVsActualTable from "@/components/dashboard/BudgetVsActualTable";
import AccountTile from "@/components/dashboard/AccountTile";
import HouseholdMemberCard from "@/components/dashboard/HouseholdMemberCard";
import { createClient } from "@/lib/supabase/server";
import { getUserFirstName } from "@/lib/auth/get-user-first-name";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import { formatMonthStartDate } from "@/lib/db/month";
import { getDashboardMonth } from "@/lib/dashboard/get-dashboard-month";
import { getDashboardSummary } from "@/lib/dashboard/get-dashboard-summary";
import {
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

  // Fetch user + membership + all dashboard data in parallel
  const supabase = await createClient();
  const [
    { data: { user }, error: userError },
    membership,
    summary,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getCurrentTenantMembership(),
    getDashboardSummary(monthStartIso),
  ]);

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const displayName = getUserFirstName(user);
  const selectedMonth = resolvedMonth.monthParam;

  // KPI badges
  const incomeBadge = computeIncomeBadge(summary.income_total, summary.budgeted_income);
  const expenseBadge = computeExpenseBadge(summary.expense_total, summary.budgeted_expense);
  const netBadge = computeNetHealthBadge({
    incomeActual: summary.income_total,
    incomeBudgeted: summary.budgeted_income,
    expenseActual: summary.expense_total,
    expenseBudgeted: summary.budgeted_expense,
  });

  const netAmount = summary.income_total - summary.expense_total;

  const leftPanelSections: WorkspaceLeftPanelSection[] = [
    {
      title: "Month",
      content: (
        <div className="space-y-2 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span>Selected</span>
            <span className="font-semibold tabular-nums">{selectedMonth}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Window start</span>
            <span className="font-medium tabular-nums">{monthStartIso}</span>
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
    >
      <div className="space-y-4">
        {/* Row 1: Household member card + 3 KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          <HouseholdMemberCard
            displayName={displayName}
            role={membership.role as "admin" | "member"}
            pendingReviewCount={summary.pending_review_count}
            budgetIsSet={summary.budget_is_set}
            lastImportDate={summary.last_transaction_date}
          />
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

        {/* Row 2: 6-month income vs expenses chart */}
        <IncomeExpenseChart trend={summary.monthly_trend ?? []} />

        {/* Row 3: Budget vs actual table (60%) + Savings / Investments tiles (40%) */}
        <div className="flex gap-4" style={{ minHeight: "320px" }}>
          {/* Left column — BVA table fills the height of this flex row */}
          <div className="flex flex-col min-h-0" style={{ flex: "3" }}>
            <BudgetVsActualTable rows={summary.budget_vs_actual ?? []} />
          </div>

          {/* Right column — Savings + Investments stacked */}
          <div className="flex flex-col gap-4" style={{ flex: "2" }}>
            <AccountTile
              kind="savings"
              accounts={summary.savings_accounts ?? []}
            />
            <AccountTile
              kind="investment"
              accounts={summary.investment_accounts ?? []}
            />
          </div>
        </div>

        {/* Row 4: Debts (50%) + Credit Cards (50%) */}
        <div className="grid grid-cols-2 gap-4">
          <AccountTile
            kind="debt"
            accounts={summary.debt_accounts ?? []}
          />
          <AccountTile
            kind="credit_card"
            accounts={summary.credit_card_accounts ?? []}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}
