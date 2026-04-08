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
    .select("id, name, category_type")
    .order("name");

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const budgetLines = await getBudgetForMonth(month);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Monthly Budget</h1>

      <div className="rounded-lg border p-4">
        <p className="text-sm">Selected month: {month}</p>
      </div>

      <BudgetTable
        categories={categories ?? []}
        month={month}
        initialLines={budgetLines}
      />
    </div>
  );
}