"use client";

import { useActionState } from "react";
import {
  createCategoryFormAction,
  initialCategoryFormState,
} from "@/app/app/budgets/categories/actions";

export default function CategoryCreateForm() {
  const [state, formAction, pending] = useActionState(
    createCategoryFormAction,
    initialCategoryFormState
  );

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-3">
      <h2 className="text-sm font-semibold text-slate-900">Create Category</h2>

      <form
        action={formAction}
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
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.name}</p>
          ) : null}
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
          {state.fieldErrors?.category_type ? (
            <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.category_type}</p>
          ) : null}
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
          {state.fieldErrors?.tag ? (
            <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.tag}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded bg-slate-900 px-3 text-sm font-medium text-white"
        >
          {pending ? "Creating..." : "Create"}
        </button>
      </form>

      {state.message ? (
        <p
          className={`mt-2 text-xs ${
            state.fieldErrors ? "text-rose-700" : "text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
