import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BudgetTable from "@/components/budgets/budget-table";
import DashboardMonthSelector from "@/components/dashboard/dashboard-month-selector";
import SummaryStrip from "@/components/budgets/summary-strip";
import { computeBudgetMetrics } from "@/components/budgets/budget-metrics";
import { buildBudgetMetricsSections } from "@/components/budgets/left-panel-insights";
import WorkspaceShell from "@/components/layout/workspace-shell";
import MemberSelectorCard from "@/components/layout/MemberSelectorCard";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  getCurrentMonthStart,
  isHistoricalMonth,
  parseMonthParam,
  serializeMonthParam,
} from "@/lib/db/month";
import { monthParamSchema } from "@/lib/validation/month";
import { getBudgetForMonth } from "./actions";

type SearchParams = Promise<{
  month?: string;
  member?: string;
}>;

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const membership = await getCurrentTenantMembership();
  const isAdmin = membership.role === "admin";
  // Server enforces: members always see own data regardless of URL param
  const activeMemberId = isAdmin ? (params.member ?? user.id) : user.id;

  const parsedMonth = monthParamSchema.safeParse((params.month ?? "").trim());
  const selectedMonthStart = parsedMonth.success
    ? parseMonthParam(parsedMonth.data)
    : getCurrentMonthStart();
  const month = serializeMonthParam(selectedMonthStart);
  const selectedMonthIsHistorical = isHistoricalMonth(selectedMonthStart);

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, tag, category_type")
    .order("category_type", { ascending: true })
    .order("tag", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const budgetLines = await getBudgetForMonth(month, activeMemberId);
  const metrics = computeBudgetMetrics(categories ?? [], budgetLines);
  const metricsSections = buildBudgetMetricsSections({ metrics });

  const leftPanelSections = [
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
    ...metricsSections,
  ];

  return (
    <WorkspaceShell
      title="Budget"
      description="Plan your month by category. Income and expense categories are separated for easier budgeting."
      leftPanelSections={leftPanelSections}
      topbarControls={<DashboardMonthSelector selectedMonth={month} />}
      isAdmin={isAdmin}
      currentUserId={user.id}
      activeMemberId={activeMemberId}
    >
      <div className="space-y-4">
        <SummaryStrip metrics={metrics} />

        <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p>
              Selected month: <span className="font-semibold">{month}</span>
            </p>
            {selectedMonthIsHistorical ? (
              <p className="text-amber-700">
                Historical month: view-only by default.
              </p>
            ) : null}
          </div>
        </div>

        {!categories?.length ? (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">No categories yet</h2>
            <p className="mt-2 text-sm text-gray-600">
              Add shared household categories before planning this month.
            </p>

            <div className="mt-4">
              <Link
                href="/app/budgets/categories"
                className="inline-flex rounded bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Manage categories
              </Link>
            </div>
          </div>
        ) : (
          <BudgetTable
            key={`${month}-${activeMemberId}`}
            categories={categories}
            month={month}
            initialLines={budgetLines}
            isHistoricalMonth={selectedMonthIsHistorical}
          />
        )}
      </div>
    </WorkspaceShell>
  );
}
