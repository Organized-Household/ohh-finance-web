"use client";

import { useActionState, useState } from "react";
import {
  deleteCategoryFormAction,
  updateCategoryFormAction,
} from "@/app/app/budgets/categories/actions";
import { initialCategoryFormState } from "@/app/app/budgets/categories/form-state";

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
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [state, updateAction, pending] = useActionState(
    updateCategoryFormAction,
    initialCategoryFormState
  );

  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="px-3 py-2 text-sm text-slate-900 align-top">
        {isEditing ? (
          <input
            form={`category-row-${category.id}`}
            id={`name-${category.id}`}
            name="name"
            type="text"
            defaultValue={category.name}
            required
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
        ) : (
          category.name
        )}
      </td>

      <td className="px-3 py-2 text-sm text-slate-700 align-top">
        {isEditing ? (
          <select
            form={`category-row-${category.id}`}
            id={`category-type-${category.id}`}
            name="category_type"
            defaultValue={category.category_type}
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        ) : (
          <span className="capitalize">{category.category_type}</span>
        )}
      </td>

      <td className="px-3 py-2 text-sm text-slate-700 align-top">
        {isEditing ? (
          <select
            form={`category-row-${category.id}`}
            id={`tag-${category.id}`}
            name="tag"
            defaultValue={category.tag}
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          >
            <option value="standard">Standard</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
          </select>
        ) : (
          <span className="capitalize">{category.tag}</span>
        )}
      </td>

      <td className="px-3 py-2 text-sm text-right align-top">
        <form
          id={`category-row-${category.id}`}
          action={updateAction}
          className="hidden"
          onSubmit={() => setIsEditing(false)}
        >
          <input type="hidden" name="id" value={category.id} />
        </form>

        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <button
                type="submit"
                form={`category-row-${category.id}`}
                disabled={pending}
                className="h-7 rounded bg-slate-900 px-2 text-xs font-medium text-white disabled:opacity-70"
              >
                {pending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
            </>
          ) : isConfirmingDelete ? (
            <>
              <form action={deleteCategoryFormAction} className="inline">
                <input type="hidden" name="id" value={category.id} />
                <button
                  type="submit"
                  className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700"
                >
                  Confirm
                </button>
              </form>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingDelete(false);
                  setIsEditing(true);
                }}
                className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setIsConfirmingDelete(true);
                }}
                className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700"
              >
                Remove
              </button>
            </>
          )}
        </div>

        {state.fieldErrors?.name ? (
          <p className="mt-1 text-[11px] text-right text-rose-700">{state.fieldErrors.name}</p>
        ) : null}
        {state.fieldErrors?.category_type ? (
          <p className="mt-1 text-[11px] text-right text-rose-700">{state.fieldErrors.category_type}</p>
        ) : null}
        {state.fieldErrors?.tag ? (
          <p className="mt-1 text-[11px] text-right text-rose-700">{state.fieldErrors.tag}</p>
        ) : null}
        {state.message ? (
          <p
            className={`mt-1 text-[11px] text-right ${
              state.fieldErrors ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </td>
    </tr>
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
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col />
            <col className="w-40" />
            <col className="w-36" />
            <col className="w-44" />
          </colgroup>
          <tbody>
            {rows.map((category) => (
              <EditableCategoryRow key={category.id} category={category} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
