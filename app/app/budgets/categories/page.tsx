import { createClient } from "@/lib/supabase/server";
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

const typeOrder: Array<"income" | "expense"> = ["income", "expense"];

const tagDescriptions: Record<"standard" | "savings" | "investment", string> = {
  standard: "Everyday categories used in normal budgeting.",
  savings: "Money set aside for a goal or future use.",
  investment: "Money planned for long-term growth.",
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

  const grouped: Record<"income" | "expense", Category[]> = {
    income: categories.filter((c) => c.category_type === "income"),
    expense: categories.filter((c) => c.category_type === "expense"),
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-gray-600">
          Categories are shared across your household. Category type controls
          whether a budget amount is treated as income or expense. Tag helps
          group the category for budgeting and future reporting.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create Category</h2>
        <p className="mt-1 text-sm text-gray-600">
          Use clear names your whole household will understand.
        </p>

        <form
          action={async (formData) => {
            "use server";

            await createCategory({
              name: String(formData.get("name") ?? ""),
              tag: String(formData.get("tag") ?? "standard"),
              category_type: String(formData.get("category_type") ?? "expense"),
            });
          }}
          className="mt-5 grid gap-4 md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Category name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div>
            <label
              htmlFor="category_type"
              className="mb-1 block text-sm font-medium"
            >
              Category type
            </label>
            <select
              id="category_type"
              name="category_type"
              defaultValue="expense"
              className="w-full rounded border px-3 py-2"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label htmlFor="tag" className="mb-1 block text-sm font-medium">
              Tag
            </label>
            <select
              id="tag"
              name="tag"
              defaultValue="standard"
              className="w-full rounded border px-3 py-2"
            >
              <option value="standard">Standard</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          <div className="md:col-span-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <p>
              <span className="font-medium">Type</span> decides whether the
              category counts as income or expense.
            </p>
            <p className="mt-1">
              <span className="font-medium">Tag</span> helps organize categories
              such as standard, savings, or investment.
            </p>
          </div>

          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-white"
            >
              Create
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {typeOrder.map((type) => (
          <section
            key={type}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold capitalize">{type}</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600">
                {grouped[type].length} categories
              </span>
            </div>

            {!grouped[type].length ? (
              <p className="text-sm text-gray-600">
                No {type} categories yet.
              </p>
            ) : (
              <div className="space-y-4">
                {grouped[type].map((category) => (
                  <div
                    key={category.id}
                    className="rounded-lg border p-4"
                  >
                    <form
                      action={async (formData) => {
                        "use server";

                        await updateCategory({
                          id: String(formData.get("id")),
                          name: String(formData.get("name") ?? ""),
                          tag: String(formData.get("tag") ?? "standard"),
                          category_type: String(
                            formData.get("category_type") ?? "expense"
                          ),
                        });
                      }}
                    >
                      <input type="hidden" name="id" value={category.id} />

                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="md:col-span-2">
                          <label
                            htmlFor={`name-${category.id}`}
                            className="mb-1 block text-sm font-medium"
                          >
                            Category name
                          </label>
                          <input
                            id={`name-${category.id}`}
                            name="name"
                            type="text"
                            defaultValue={category.name}
                            className="w-full rounded border px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`category-type-${category.id}`}
                            className="mb-1 block text-sm font-medium"
                          >
                            Category type
                          </label>
                          <select
                            id={`category-type-${category.id}`}
                            name="category_type"
                            defaultValue={category.category_type}
                            className="w-full rounded border px-3 py-2"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`tag-${category.id}`}
                            className="mb-1 block text-sm font-medium"
                          >
                            Tag
                          </label>
                          <select
                            id={`tag-${category.id}`}
                            name="tag"
                            defaultValue={category.tag}
                            className="w-full rounded border px-3 py-2"
                          >
                            <option value="standard">Standard</option>
                            <option value="savings">Savings</option>
                            <option value="investment">Investment</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                        {tagDescriptions[category.tag]}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="submit"
                          className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
                        >
                          Save
                        </button>
                      </div>
                    </form>

                    <form
                      action={async (formData) => {
                        "use server";

                        await deleteCategory({
                          id: String(formData.get("id")),
                        });
                      }}
                      className="mt-2"
                    >
                      <input type="hidden" name="id" value={category.id} />
                      <button
                        type="submit"
                        className="rounded border px-4 py-2 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}