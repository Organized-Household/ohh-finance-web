"use client";

import { useActionState, useState } from "react";
import {
  type CategoryFormState,
  deleteCategoryFormAction,
  updateCategoryFormAction,
} from "@/app/app/budgets/categories/actions";
import { initialCategoryFormState } from "@/app/app/budgets/categories/form-state";

type CategoryRow = {
  id: string;
  name: string;
  category_type: "income" | "expense";
  tag: "standard" | "savings" | "investment" | "debt_payment";
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
  const [draftName, setDraftName] = useState(category.name);
  const [draftCategoryType, setDraftCategoryType] = useState(
    category.category_type
  );
  const [draftTag, setDraftTag] = useState(category.tag);
  const [lastSavedName, setLastSavedName] = useState<string | null>(null);
  const [lastSavedCategoryType, setLastSavedCategoryType] = useState<
    CategoryRow["category_type"] | null
  >(null);
  const [lastSavedTag, setLastSavedTag] = useState<CategoryRow["tag"] | null>(
    null
  );

  const updateActionWithUiState = async (
    prevState: CategoryFormState,
    formData: FormData
  ) => {
    const nextState = await updateCategoryFormAction(prevState, formData);
    if (nextState.message === "Saved." && !nextState.fieldErrors) {
      setLastSavedName(draftName);
      setLastSavedCategoryType(draftCategoryType);
      setLastSavedTag(draftTag);
      setIsEditing(false);
      setIsConfirmingDelete(false);
    }
    return nextState;
  };

  const [state, updateAction, pending] = useActionState(
    updateActionWithUiState,
    initialCategoryFormState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategoryFormAction,
    initialCategoryFormState
  );
  const displayName = lastSavedName ?? category.name;
  const displayCategoryType = lastSavedCategoryType ?? category.category_type;
  const displayTag = lastSavedTag ?? category.tag;

  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="px-3 py-2 text-sm text-slate-900 align-top">
        {isEditing ? (
          <input
            id={`name-${category.id}`}
            name={`category-name-${category.id}`}
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            required
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
        ) : (
          displayName
        )}
      </td>

      <td className="px-3 py-2 text-sm text-slate-700 align-top">
        {isEditing ? (
          <select
            id={`category-type-${category.id}`}
            name={`category-type-${category.id}`}
            value={draftCategoryType}
            onChange={(event) =>
              setDraftCategoryType(event.target.value as CategoryRow["category_type"])
            }
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        ) : (
          <span className="capitalize">{displayCategoryType}</span>
        )}
      </td>

      <td className="px-3 py-2 text-sm text-slate-700 align-top">
        {isEditing ? (
          <select
            id={`tag-${category.id}`}
            name={`tag-${category.id}`}
            value={draftTag}
            onChange={(event) => setDraftTag(event.target.value as CategoryRow["tag"])}
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          >
            <option value="standard">Standard</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
            <option value="debt_payment">Debt Payment</option>
          </select>
        ) : (
          <span className="capitalize">{displayTag.replace("_", " ")}</span>
        )}
      </td>

      <td className="px-3 py-2 text-sm text-right align-top">
        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <form action={updateAction} className="inline">
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="name" value={draftName} />
                <input
                  type="hidden"
                  name="category_type"
                  value={draftCategoryType}
                />
                <input type="hidden" name="tag" value={draftTag} />
                <button
                  type="submit"
                  disabled={pending}
                  className="h-7 rounded bg-slate-900 px-2 text-xs font-medium text-white disabled:opacity-70"
                >
                  {pending ? "Saving..." : "Save"}
                </button>
              </form>
              <button
                type="button"
                disabled={pending}
                onClick={() => setIsEditing(false)}
                className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
            </>
          ) : isConfirmingDelete ? (
            <>
              <form action={deleteAction} className="inline">
                <input type="hidden" name="id" value={category.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700"
                >
                  {deletePending ? "Removing..." : "Confirm"}
                </button>
              </form>
              <button
                type="button"
                disabled={deletePending}
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
                  setDraftName(displayName);
                  setDraftCategoryType(displayCategoryType);
                  setDraftTag(displayTag);
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
        {deleteState.message ? (
          <p
            className={`mt-1 text-[11px] text-right ${
              deleteState.message === "Category removed."
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {deleteState.message}
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
