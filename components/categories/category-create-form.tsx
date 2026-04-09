type CategoryCreateFormProps = {
  createAction: (formData: FormData) => Promise<void>;
};

export default function CategoryCreateForm({
  createAction,
}: CategoryCreateFormProps) {
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-3">
      <h2 className="text-sm font-semibold text-slate-900">Create Category</h2>

      <form
        action={createAction}
        className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_10rem_9rem_auto]"
      >
        <div>
          <label htmlFor="create-name" className="sr-only">
            Category name
          </label>
          <input
            id="create-name"
            name="name"
            type="text"
            required
            placeholder="Category name"
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="create-category-type" className="sr-only">
            Category type
          </label>
          <select
            id="create-category-type"
            name="category_type"
            defaultValue="expense"
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label htmlFor="create-tag" className="sr-only">
            Tag
          </label>
          <select
            id="create-tag"
            name="tag"
            defaultValue="standard"
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          >
            <option value="standard">Standard</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
          </select>
        </div>

        <button
          type="submit"
          className="h-8 rounded bg-slate-900 px-3 text-sm font-medium text-white"
        >
          Create
        </button>
      </form>
    </section>
  );
}
