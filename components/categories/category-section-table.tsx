"use client";

import { useActionState } from "react";
import {
  deleteCategoryFormAction,
  initialCategoryFormState,
  updateCategoryFormAction,
} from "@/app/app/budgets/categories/actions";

type CategoryRow = {
  id: string;
  name: string;
  category_type: "income" | "expense";
  tag: "standard" | "savings" | "investment";
};

type CategorySectionTableProps = {
  title: string;
  rows: CategoryRow[];
};

type EditableCategoryRowProps = {
  category: CategoryRow;
};

function EditableCategoryRow({ category }: EditableCategoryRowProps) {
  const [state, updateAction, pending] = useActionState(
    updateCategoryFormAction,
    initialCategoryFormState
  );

  return (
    <form
      id={`category-row-${category.id}`}
      action={updateAction}
      className="grid items-center gap-2 px-3 py-1.5 md:grid-cols-[minmax(0,1fr)_10rem_9rem_auto]"
    >
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
        {state.fieldErrors?.name ? (
          <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`category-type-${category.id}`} className="sr-only">
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
        {state.fieldErrors?.category_type ? (
          <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.category_type}</p>
        ) : null}
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
        {state.fieldErrors?.tag ? (
          <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.tag}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-1">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded bg-slate-900 px-2.5 text-xs font-medium text-white"
        >
          {pending ? "Saving..." : "Save"}
        </button>

        <details className="relative">
          <summary className="h-8 cursor-pointer list-none rounded border border-slate-300 px-2.5 text-xs leading-8 text-slate-700">
            Delete
          </summary>

          <div className="absolute right-0 top-9 z-10 w-36 rounded border border-slate-300 bg-white p-2 shadow">
            <p className="mb-2 text-[11px] text-slate-600">Delete category?</p>
            <button
              type="submit"
              formAction={deleteCategoryFormAction}
              className="w-full rounded bg-rose-600 px-2 py-1.5 text-xs font-medium text-white"
            >
              Confirm
            </button>
          </div>
        </details>
      </div>

      {state.message ? (
        <p
          className={`md:col-span-4 -mt-1 text-[11px] ${
            state.fieldErrors ? "text-rose-700" : "text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export default function CategorySectionTable({ title, rows }: CategorySectionTableProps) {
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
            <EditableCategoryRow key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  );
}
