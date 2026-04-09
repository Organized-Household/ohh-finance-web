type CategoryRow = {
  id: string;
  name: string;
  category_type: "income" | "expense";
  tag: "standard" | "savings" | "investment";
};

type CategorySectionTableProps = {
  title: string;
  rows: CategoryRow[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export default function CategorySectionTable({
  title,
  rows,
  updateAction,
  deleteAction,
}: CategorySectionTableProps) {
  return (
    <section className="border-t border-slate-300 first:border-t-0">
      <div className="flex items-center justify-between bg-slate-100 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          {title}
        </h3>
        <span className="text-[11px] font-medium text-slate-500">
          {rows.length} categories
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-3 py-2 text-xs text-slate-500">
          No categories in this group.
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {rows.map((category) => (
            <div
              key={category.id}
              className="grid items-center gap-2 px-3 py-1.5 md:grid-cols-[minmax(0,1fr)_10rem_9rem_auto]"
            >
              <form action={updateAction} className="contents">
                <input type="hidden" name="id" value={category.id} />

                <div>
                  <label htmlFor={`name-${category.id}`} className="sr-only">
                    Name
                  </label>
                  <input
                    id={`name-${category.id}`}
                    name="name"
                    type="text"
                    defaultValue={category.name}
                    required
                    className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`category-type-${category.id}`}
                    className="sr-only"
                  >
                    Category type
                  </label>
                  <select
                    id={`category-type-${category.id}`}
                    name="category_type"
                    defaultValue={category.category_type}
                    className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={`tag-${category.id}`} className="sr-only">
                    Tag
                  </label>
                  <select
                    id={`tag-${category.id}`}
                    name="tag"
                    defaultValue={category.tag}
                    className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="savings">Savings</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button
                    type="submit"
                    className="h-8 rounded bg-slate-900 px-2.5 text-xs font-medium text-white"
                  >
                    Save
                  </button>
                </div>
              </form>

              <div className="md:col-start-4 md:row-start-1 md:justify-self-end">
                <details className="relative">
                  <summary className="h-8 cursor-pointer list-none rounded border border-slate-300 px-2.5 text-xs leading-8 text-slate-700">
                    Delete
                  </summary>

                  <div className="absolute right-0 top-9 z-10 w-36 rounded border border-slate-300 bg-white p-2 shadow">
                    <p className="mb-2 text-[11px] text-slate-600">
                      Delete category?
                    </p>
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <button
                        type="submit"
                        className="w-full rounded bg-rose-600 px-2 py-1.5 text-xs font-medium text-white"
                      >
                        Confirm
                      </button>
                    </form>
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
