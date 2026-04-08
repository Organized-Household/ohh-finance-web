import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BudgetTable from "@/components/budgets/budget-table";
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Monthly Budget</h1>
          <p className="text-sm text-gray-600">
            Plan your month by category. Income and expense categories are
            separated for easier budgeting.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="rounded-lg border px-3 py-2 text-sm">
            Selected month: <span className="font-medium">{month}</span>
          </div>

          <Link
            href="/app/budgets/categories"
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Manage categories
          </Link>
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
          categories={categories}
          month={month}
          initialLines={budgetLines}
        />
      )}
    </div>
  );
}