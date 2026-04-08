import { createClient } from "@/lib/supabase/server"
import BudgetTable from "@/components/budgets/budget-table"

export default async function BudgetPage({
  searchParams
}: {
  searchParams: { month?: string }
}) {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name")

  const month =
    searchParams.month ??
    new Date().toISOString().slice(0, 7)

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">
        Monthly Budget
      </h1>

      <BudgetTable
        categories={categories ?? []}
        month={month}
      />

    </div>
  )
}