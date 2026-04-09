import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BudgetTable from "@/components/budgets/budget-table";
import WorkspaceShell from "@/components/layout/workspace-shell";
import { budgetWorkspaceLeftPanelSections } from "@/components/layout/workspace-left-panel";
import { getBudgetForMonth } from "./actions";

type SearchParams = Promise<{
  month?: string;
}>;

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : new Date().toISOString().slice(0, 7);

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, tag, category_type")
    .order("category_type", { ascending: true })
    .order("tag", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const budgetLines = await getBudgetForMonth(month);

  return (
    <WorkspaceShell
      title="Monthly Budget"
      description="Plan your month by category. Income and expense categories are separated for easier budgeting."
      leftPanelSections={budgetWorkspaceLeftPanelSections}
      topbarControls={
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Month selector
            </p>
            <select
              disabled
              aria-label="Month selector placeholder"
              className="mt-1 w-36 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-90"
              defaultValue={month}
            >
              <option value={month}>{month}</option>
            </select>
          </div>

          <button
            type="button"
            disabled
            className="rounded-md border border-slate-300 bg-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed"
          >
            + New Month
          </button>

          <Link
            href="/app/budgets/categories"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Manage Categories
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Selected month: <span className="font-semibold">{month}</span>
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
            categories={categories}
            month={month}
            initialLines={budgetLines}
          />
        )}
      </div>
    </WorkspaceShell>
  );
}
