"use client";

import { useActionState, useState } from "react";
import {
  deleteDebtAccountFormAction,
  updateDebtAccountFormAction,
} from "@/app/app/accounts/debts/actions";
import { initialDebtAccountFormState } from "@/app/app/accounts/debts/form-state";

type DebtAccountRow = {
  id: string;
  name: string;
  type: string;
};

type DebtAccountsTableProps = {
  rows: DebtAccountRow[];
};

type EditableRowProps = {
  row: DebtAccountRow;
};

function EditableRow({ row }: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [state, updateAction, pending] = useActionState(
    updateDebtAccountFormAction,
    initialDebtAccountFormState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteDebtAccountFormAction,
    initialDebtAccountFormState
  );

  return (
    <tr className="border-b border-slate-200">
      <td className="px-3 py-2 align-top text-sm text-slate-900">
        {isEditing ? (
          <input
            form={`debt-row-${row.id}`}
            id={`debt-name-${row.id}`}
            name="name"
            type="text"
            defaultValue={row.name}
            required
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
        ) : (
          row.name
        )}
      </td>

      <td className="px-3 py-2 align-top text-sm text-slate-700">
        {isEditing ? (
          <input
            form={`debt-row-${row.id}`}
            id={`debt-type-${row.id}`}
            name="type"
            type="text"
            defaultValue={row.type}
            required
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
        ) : (
          row.type
        )}
      </td>

      <td className="px-3 py-2 align-top text-right text-sm">
        <form
          id={`debt-row-${row.id}`}
          action={updateAction}
          className="hidden"
          onSubmit={() => setIsEditing(false)}
        >
          <input type="hidden" name="id" value={row.id} />
        </form>

        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <button
                type="submit"
                form={`debt-row-${row.id}`}
                disabled={pending}
                className="h-7 rounded bg-slate-900 px-2 text-xs font-medium text-white disabled:opacity-70"
              >
                {pending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setIsEditing(false)}
                className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700 disabled:opacity-70"
              >
                Cancel
              </button>
            </>
          ) : isConfirmingDelete ? (
            <>
              <form action={deleteAction} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700 disabled:opacity-70"
                >
                  {deletePending ? "Removing..." : "Confirm"}
                </button>
              </form>
              <button
                type="button"
                disabled={deletePending}
                onClick={() => setIsConfirmingDelete(false)}
                className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700 disabled:opacity-70"
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
        {state.fieldErrors?.type ? (
          <p className="mt-1 text-[11px] text-right text-rose-700">{state.fieldErrors.type}</p>
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
          <p className="mt-1 text-[11px] text-right text-rose-700">{deleteState.message}</p>
        ) : null}
      </td>
    </tr>
  );
}

export default function DebtAccountsTable({ rows }: DebtAccountsTableProps) {
  if (!rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
        No debt accounts yet.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <table className="w-full border-collapse">
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Name
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Type
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <EditableRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
