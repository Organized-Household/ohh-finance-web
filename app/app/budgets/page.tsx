import { createClient } from "@/lib/supabase/server";

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
        <p className="text-sm text-muted-foreground">
          Selected month: {month}
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">Categories</h2>

        {categories && categories.length > 0 ? (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id} className="text-sm">
                {category.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No categories available yet.
          </p>
        )}
      </div>
    </div>
  );
}