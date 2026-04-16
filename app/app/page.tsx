import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import DashboardMonthSelector from "@/components/dashboard/dashboard-month-selector";
import IncomeVsExpenseSummary from "@/components/dashboard/income-vs-expense-summary";
import BudgetVsActualTable from "@/components/dashboard/budget-vs-actual-table";
import IncomeList from "@/components/dashboard/income-list";
import CreditCardExpensesByAccountSection from "@/components/dashboard/credit-card-expenses-by-account";
import HouseholdMemberCard from "@/components/layout/household-member-card";
import { createClient } from "@/lib/supabase/server";
import { getUserFirstName } from "@/lib/auth/get-user-first-name";
import { formatMonthStartDate } from "@/lib/db/month";
import { getDashboardMonth } from "@/lib/dashboard/get-dashboard-month";
import { getIncomeVsExpenseSummary } from "@/lib/dashboard/get-income-vs-expense-summary";
import { getBudgetVsActual } from "@/lib/dashboard/get-budget-vs-actual";
import { getIncomeList } from "@/lib/dashboard/get-income-list";
import { getCreditCardExpensesByAccount } from "@/lib/dashboard/get-credit-card-expenses-by-account";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type DashboardData = {
  memberFirstName: string;
  selectedMonth: string;
  monthStart: string;
  nextMonthStart: string;
};

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const resolvedMonth = getDashboardMonth(params);
  const monthStartIso = formatMonthStartDate(resolvedMonth.monthStart);
  const nextMonthStartIso = formatMonthStartDate(resolvedMonth.nextMonthStart);

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const incomeVsExpenseSummary = await getIncomeVsExpenseSummary(
    monthStartIso,
    nextMonthStartIso
  );
  const budgetVsActualData = await getBudgetVsActual(monthStartIso, nextMonthStartIso);
  const incomeList = await getIncomeList(monthStartIso, nextMonthStartIso);
  const creditCardExpensesByAccount = await getCreditCardExpensesByAccount(
    monthStartIso,
    nextMonthStartIso
  );

  const dashboardData: DashboardData = {
    memberFirstName: getUserFirstName(user),
    selectedMonth: resolvedMonth.monthParam,
    monthStart: monthStartIso,
    nextMonthStart: nextMonthStartIso,
  };

  const leftPanelSections: WorkspaceLeftPanelSection[] = [
    {
      title: "Household Member",
      content: <HouseholdMemberCard firstName={dashboardData.memberFirstName} />,
    },
    {
      title: "Month Context",
      content: (
        <div className="space-y-2 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span>Selected Month</span>
            <span className="font-semibold tabular-nums">{dashboardData.selectedMonth}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Window Start</span>
            <span className="font-medium tabular-nums">{dashboardData.monthStart}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Window End</span>
            <span className="font-medium tabular-nums">{dashboardData.nextMonthStart}</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="Dashboard"
      description="Tenant-scoped monthly overview."
      leftPanelSections={leftPanelSections}
      topbarControls={<DashboardMonthSelector selectedMonth={dashboardData.selectedMonth} />}
    >
      <div className="space-y-3">
        <IncomeVsExpenseSummary summary={incomeVsExpenseSummary} />
        <IncomeList items={incomeList} />
        <CreditCardExpensesByAccountSection data={creditCardExpensesByAccount} />
        <BudgetVsActualTable data={budgetVsActualData} />
      </div>
    </WorkspaceShell>
  );
}
