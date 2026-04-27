import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WorkspaceShell from "@/components/layout/workspace-shell";
import { computeBudgetMetrics } from "@/components/budgets/budget-metrics";
import { buildBudgetMetricsSections } from "@/components/budgets/left-panel-insights";
import CategoryCreateForm from "@/components/categories/category-create-form";
import GroupedCategoryTable from "@/components/categories/grouped-category-table";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import { getBudgetForMonth } from "../actions";

type Category = {
  id: string;
  name: string;
  tag: string;
  category_type: "income" | "expense";
};

export default async function BudgetCategoriesPage() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const membership = await getCurrentTenantMembership();
  const isAdmin = membership.role === "admin";

  const month = new Date().toISOString().slice(0, 7);

  const [
    { data: categoriesData, error: categoriesError },
    { data: expenseTypesData, error: expenseTypesError },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, tag, category_type")
      .order("category_type", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("expense_types")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (categoriesError) {
    throw new Error(`Failed to load categories: ${categoriesError.message}`);
  }
  if (expenseTypesError) {
    throw new Error(`Failed to load expense types: ${expenseTypesError.message}`);
  }

  const categories: Category[] = (categoriesData ?? []) as Category[];
  const expenseTypes = expenseTypesData ?? [];

  // Budget metrics for categories use the logged-in user's budget (not activeMemberId —
  // categories page has no member selector; shared household context only).
  const budgetLines = await getBudgetForMonth(month);
  const metrics = computeBudgetMetrics(categories, budgetLines);
  const metricsSections = buildBudgetMetricsSections({ metrics });

  // Fetch household info for the static info card
  const [{ data: tenantData }, { count: activeMemberCount }] = await Promise.all([
    supabaseAdmin
      .from("tenants")
      .select("name")
      .eq("id", membership.tenant_id)
      .single(),
    supabaseAdmin
      .from("tenant_members")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", membership.tenant_id)
      .eq("is_active", true),
  ]);

  const tenantName = tenantData?.name ?? "Your Household";
  const memberCount = activeMemberCount ?? 1;

  const leftPanelSections = [
    {
      title: "Household",
      content: (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Household
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">{tenantName}</p>
          <p className="mt-1.5 text-xs text-slate-500">
            These categories are shared by {memberCount}{" "}
            {memberCount === 1 ? "member" : "members"}.
          </p>
        </div>
      ),
    },
    ...metricsSections,
  ];

  return (
    <WorkspaceShell
      title="Categories"
      description="Categories are shared across your household. Category type controls whether a budget amount is treated as income or expense. Tag helps group categories for budgeting and reporting."
      leftPanelSections={leftPanelSections}
      isAdmin={isAdmin}
      currentUserId={user.id}
      activeMemberId={user.id}
    >
      <div className="space-y-3">
        <CategoryCreateForm expenseTypes={expenseTypes} />

        <GroupedCategoryTable categories={categories} expenseTypes={expenseTypes} />
      </div>
    </WorkspaceShell>
  );
}
