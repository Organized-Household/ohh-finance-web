import { createClient } from "@/lib/supabase/server";
import WorkspaceShell from "@/components/layout/workspace-shell";
import { computeBudgetMetrics } from "@/components/budgets/budget-metrics";
import { buildBudgetLeftPanelSections } from "@/components/budgets/left-panel-insights";
import { getUserFirstName } from "@/lib/auth/get-user-first-name";
import CategoryCreateForm from "@/components/categories/category-create-form";
import GroupedCategoryTable from "@/components/categories/grouped-category-table";
import { getBudgetForMonth } from "../actions";

type Category = {
  id: string;
  name: string;
  tag: "standard" | "savings" | "investment";
  category_type: "income" | "expense";
};

export default async function BudgetCategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const memberFirstName = getUserFirstName(user);
  const month = new Date().toISOString().slice(0, 7);

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, tag, category_type")
    .order("category_type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const categories: Category[] = (data ?? []) as Category[];
  const budgetLines = await getBudgetForMonth(month);
  const metrics = computeBudgetMetrics(categories, budgetLines);
  const budgetLeftPanelSections = buildBudgetLeftPanelSections({
    metrics,
    memberFirstName,
  });

  return (
    <WorkspaceShell
      title="Categories"
      description="Categories are shared across your household. Category type controls whether a budget amount is treated as income or expense. Tag helps group categories for budgeting and reporting."
      leftPanelSections={budgetLeftPanelSections}
    >
      <div className="space-y-3">
        <CategoryCreateForm />

        <GroupedCategoryTable categories={categories} />
      </div>
    </WorkspaceShell>
  );
}
