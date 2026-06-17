"use client";

import { useState, useTransition } from "react";
import {
  createExpenseType,
  toggleExpenseTypeActive,
  deleteExpenseType,
} from "./actions";

type ExpenseType = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
};

type Props = {
  expenseTypes: ExpenseType[];
};

function generateSlugPreview(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export default function ExpenseTypesClient({ expenseTypes }: Props) {
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const slugPreview = generateSlugPreview(newName);

  function handleAdd() {
    setFormError(null);
    setActionError(null);
    if (!newName.trim()) {
      setFormError("Name is required.");
      return;
    }
    startTransition(async () => {
      const result = await createExpenseType({ name: newName.trim() });
      if (result.error) {
        setFormError(result.error);
      } else {
        setNewName("");
      }
    });
  }

  function handleToggle(id: string, currentActive: boolean) {
    setActionError(null);
    startTransition(async () => {
      const result = await toggleExpenseTypeActive(id, !currentActive);
      if (result.error) setActionError(result.error);
    });
  }

  function handleDelete(id: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteExpenseType(id);
      if (result.error) setActionError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <section className="rounded-lg border border-slate-300 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-900">Add Expense Type</h2>
        <div className="mt-2 flex items-start gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setFormError(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="e.g. Charity"
              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
              disabled={isPending}
            />
            {newName && (
              <p className="mt-1 text-[11px] text-slate-400">
                Slug: <span className="font-mono">{slugPreview || "—"}</span>
              </p>
            )}
            {formError ? (
              <p className="mt-1 text-[11px] text-rose-700">{formError}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending}
            className="h-8 rounded bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Add Expense Type"}
          </button>
        </div>
      </section>

      {actionError ? (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {actionError}
        </p>
      ) : null}

      {/* Table */}
      <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col />
            <col className="w-40" />
            <col className="w-24" />
            <col className="w-44" />
          </colgroup>
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
                Name
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
                Slug
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
                Status
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {expenseTypes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-sm text-slate-500">
                  No expense types found.
                </td>
              </tr>
            ) : (
              expenseTypes.map((et) => (
                <ExpenseTypeRow
                  key={et.id}
                  et={et}
                  isPending={isPending}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function ExpenseTypeRow({
  et,
  isPending,
  onToggle,
  onDelete,
}: {
  et: ExpenseType;
  isPending: boolean;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="px-3 py-2 text-sm text-slate-900">
        {et.name}
        {et.is_system ? (
          <span className="ml-1.5 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            system
          </span>
        ) : null}
      </td>
      <td className="px-3 py-2 text-sm text-slate-500">
        <span className="font-mono text-xs">{et.slug}</span>
      </td>
      <td className="px-3 py-2">
        {et.is_active ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            Inactive
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-2">
          {!et.is_system && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onToggle(et.id, et.is_active)}
              className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700 disabled:opacity-50"
            >
              {et.is_active ? "Deactivate" : "Activate"}
            </button>
          )}
          {!et.is_system && (
            confirmingDelete ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => { onDelete(et.id); setConfirmingDelete(false); }}
                  className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setConfirmingDelete(false)}
                  className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmingDelete(true)}
                className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700 disabled:opacity-50"
              >
                Delete
              </button>
            )
          )}
          {et.is_system && (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}
