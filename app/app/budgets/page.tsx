import { createClient } from "@/lib/supabase/server";
import BudgetTable from "@/components/budgets/budget-table";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Monthly Budget</h1>

      <div className="rounded-lg border p-4">
        <p className="text-sm">Selected month: {month}</p>
      </div>

      <BudgetTable categories={categories ?? []} month={month} />
    </div>
  );
}