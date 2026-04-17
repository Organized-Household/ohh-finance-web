import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import DashboardMonthSelector from "@/components/dashboard/dashboard-month-selector";
import KpiCard from "@/components/dashboard/KpiCard";
import IncomeExpenseChart from "@/components/dashboard/IncomeExpenseChart";
import DashboardBvaRow from "@/components/dashboard/DashboardBvaRow";
import AccountTile from "@/components/dashboard/AccountTile";
import HouseholdMemberCard from "@/components/dashboard/HouseholdMemberCard";
import { createClient } from "@/lib/supabase/server";
import { getUserFirstName } from "@/lib/auth/get-user-first-name";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import { formatMonthStartDate } from "@/lib/db/month";
import { getDashboardMonth } from "@/lib/dashboard/get-dashboard-month";
import { getDashboardSummary } from "@/lib/dashboard/get-dashboard-summary";
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
  // Computed once here; passed to all badge functions and client components
  const monthProgress = computeMonthProgress(resolvedMonth.monthStart, new Date());

  // Fetch user + membership + dashboard data in parallel
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

  // Left panel: Household Member card only
  const leftPanelSections: WorkspaceLeftPanelSection[] = [
    {
      title: "Household",
      content: (
        <HouseholdMemberCard
          displayName={displayName}
          role={membership.role as "admin" | "member"}
          pendingReviewCount={summary.pending_review_count}
          budgetIsSet={summary.budget_is_set}
          lastImportDate={summary.last_transaction_date}
        />
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
      <div className="space-y-2">
        {/* Row 1: 3 KPI cards — full content width */}
        <div className="grid grid-cols-3 gap-2">
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

        {/* Row 2: 6-month chart */}
        <IncomeExpenseChart
          trend={summary.monthly_trend ?? []}
          currentMonthStart={monthStartIso}
        />

        {/* Row 3: BVA table (60%) + Savings/Investments tiles (40%)
            DashboardBvaRow is a client component that owns the rightColRef
            so BudgetVsActualTable can height-lock to the right column */}
        <DashboardBvaRow
          bvaRows={summary.budget_vs_actual ?? []}
          savingsAccounts={summary.savings_accounts ?? []}
          investmentAccounts={summary.investment_accounts ?? []}
          monthProgress={monthProgress}
        />

        {/* Row 4: Debts (50%) + Credit Cards (50%) */}
        <div className="grid grid-cols-2 gap-2">
          <AccountTile kind="debt" accounts={summary.debt_accounts ?? []} />
          <AccountTile kind="credit_card" accounts={summary.credit_card_accounts ?? []} />
        </div>
      </div>
    </WorkspaceShell>
  );
}
