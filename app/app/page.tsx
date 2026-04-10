import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import DashboardMonthSelector from "@/components/dashboard/dashboard-month-selector";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import { formatMonthStartDate } from "@/lib/db/month";
import { getDashboardMonth } from "@/lib/dashboard/get-dashboard-month";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type DashboardData = {
  userEmail: string;
  selectedMonth: string;
  monthStart: string;
  nextMonthStart: string;
  transactionCount: number;
};

async function getDashboardData(
  monthStartIso: string,
  nextMonthStartIso: string
): Promise<{ transactionCount: number }> {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", membership.tenant_id)
    .gte("transaction_date", monthStartIso)
    .lt("transaction_date", nextMonthStartIso);

  if (error) {
    throw new Error(`Failed to load dashboard data: ${error.message}`);
  }

  return {
    transactionCount: count ?? 0,
  };
}

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

  const dashboardStats = await getDashboardData(monthStartIso, nextMonthStartIso);

  const dashboardData: DashboardData = {
    userEmail: user.email ?? "Unknown user",
    selectedMonth: resolvedMonth.monthParam,
    monthStart: monthStartIso,
    nextMonthStart: nextMonthStartIso,
    transactionCount: dashboardStats.transactionCount,
  };

  const leftPanelSections: WorkspaceLeftPanelSection[] = [
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
      <div className="space-y-2 text-sm text-slate-700">
        <p>Signed in as {dashboardData.userEmail}</p>
        <p>
          Transactions in selected month: {" "}
          <span className="font-semibold tabular-nums">{dashboardData.transactionCount}</span>
        </p>
      </div>
    </WorkspaceShell>
  );
}
