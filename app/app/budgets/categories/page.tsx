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

export default async function BudgetCategoriesPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, tag, category_type")
    .order("name");

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Budget Categories</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Create Category</h2>

        <form
          action={async (formData) => {
            "use server";

            await createCategory({
              name: String(formData.get("name") ?? ""),
              tag: String(formData.get("tag") ?? "standard"),
              category_type: String(formData.get("category_type") ?? "expense"),
            });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Category name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="rounded border px-3 py-2"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tag" className="text-sm font-medium">
              Tag
            </label>
            <select
              id="tag"
              name="tag"
              defaultValue="standard"
              className="rounded border px-3 py-2"
            >
              <option value="standard">Standard</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="category_type" className="text-sm font-medium">
              Category type
            </label>
            <select
              id="category_type"
              name="category_type"
              defaultValue="expense"
              className="rounded border px-3 py-2"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Create
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Existing Categories</h2>

        <div className="space-y-4">
          {(categories as Category[] | null)?.map((category) => (
            <form
              key={category.id}
              action={async (formData) => {
                "use server";

                const intent = String(formData.get("intent") ?? "update");

                if (intent === "delete") {
                  await deleteCategory({
                    id: String(formData.get("id")),
                  });
                  return;
                }

                await updateCategory({
                  id: String(formData.get("id")),
                  name: String(formData.get("name") ?? ""),
                  tag: String(formData.get("tag") ?? "standard"),
                  category_type: String(
                    formData.get("category_type") ?? "expense"
                  ),
                });
              }}
              className="flex flex-wrap items-end gap-3 rounded border p-4"
            >
              <input type="hidden" name="id" value={category.id} />

              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`name-${category.id}`}
                  className="text-sm font-medium"
                >
                  Category name
                </label>
                <input
                  id={`name-${category.id}`}
                  name="name"
                  type="text"
                  defaultValue={category.name}
                  className="rounded border px-3 py-2"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`tag-${category.id}`}
                  className="text-sm font-medium"
                >
                  Tag
                </label>
                <select
                  id={`tag-${category.id}`}
                  name="tag"
                  defaultValue={category.tag}
                  className="rounded border px-3 py-2"
                >
                  <option value="standard">Standard</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`category-type-${category.id}`}
                  className="text-sm font-medium"
                >
                  Category type
                </label>
                <select
                  id={`category-type-${category.id}`}
                  name="category_type"
                  defaultValue={category.category_type}
                  className="rounded border px-3 py-2"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <button
                type="submit"
                name="intent"
                value="update"
                className="rounded bg-black px-4 py-2 text-white"
              >
                Save
              </button>

              <button
                type="submit"
                name="intent"
                value="delete"
                className="rounded border px-4 py-2"
              >
                Delete
              </button>
            </form>
          ))}

          {!categories?.length ? (
            <p className="text-sm text-gray-600">No categories yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}