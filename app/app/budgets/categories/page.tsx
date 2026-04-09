import { createClient } from "@/lib/supabase/server";
import WorkspaceShell from "@/components/layout/workspace-shell";
import { budgetWorkspaceLeftPanelSections } from "@/components/layout/workspace-left-panel";
import CategoryCreateForm from "@/components/categories/category-create-form";
import GroupedCategoryTable from "@/components/categories/grouped-category-table";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";

type Category = {
  id: string;
  name: string;
  tag: "standard" | "savings" | "investment";
  category_type: "income" | "expense";
};

export default async function BudgetCategoriesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, tag, category_type")
    .order("category_type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const categories: Category[] = (data ?? []) as Category[];

  const createAction = async (formData: FormData) => {
    "use server";

    await createCategory({
      name: String(formData.get("name") ?? ""),
      tag: String(formData.get("tag") ?? "standard"),
      category_type: String(formData.get("category_type") ?? "expense"),
    });
  };

  const updateAction = async (formData: FormData) => {
    "use server";

    await updateCategory({
      id: String(formData.get("id")),
      name: String(formData.get("name") ?? ""),
      tag: String(formData.get("tag") ?? "standard"),
      category_type: String(formData.get("category_type") ?? "expense"),
    });
  };

  const deleteAction = async (formData: FormData) => {
    "use server";

    await deleteCategory({
      id: String(formData.get("id")),
    });
  };

  return (
    <WorkspaceShell
      title="Categories"
      description="Categories are shared across your household. Category type controls whether a budget amount is treated as income or expense. Tag helps group categories for budgeting and reporting."
      leftPanelSections={budgetWorkspaceLeftPanelSections}
      topbarControls={
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Category controls placeholder (Phase 2)
        </div>
      }
    >
      <div className="space-y-3">
        <CategoryCreateForm createAction={createAction} />

        <GroupedCategoryTable
          categories={categories}
          updateAction={updateAction}
          deleteAction={deleteAction}
        />
      </div>
    </WorkspaceShell>
  );
}
