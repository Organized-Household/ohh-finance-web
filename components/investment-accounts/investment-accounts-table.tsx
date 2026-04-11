"use client";

import { useActionState, useState } from "react";
import {
  deleteInvestmentAccountFormAction,
  updateInvestmentAccountFormAction,
} from "@/app/app/accounts/investments/actions";
import { initialInvestmentAccountFormState } from "@/app/app/accounts/investments/form-state";

type InvestmentAccountRow = {
  id: string;
  name: string;
  account_type: string;
};

type InvestmentAccountsTableProps = {
  rows: InvestmentAccountRow[];
};

type EditableRowProps = {
  row: InvestmentAccountRow;
};

function EditableRow({ row }: EditableRowProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [state, updateAction, pending] = useActionState(
    updateInvestmentAccountFormAction,
    initialInvestmentAccountFormState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteInvestmentAccountFormAction,
    initialInvestmentAccountFormState
  );

  return (
    <tr className="border-b border-slate-200">
      <td className="px-3 py-2 align-top text-sm text-slate-900">
        <form
          action={updateAction}
          className="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem_auto]"
        >
          <input type="hidden" name="id" value={row.id} />

          <div>
            <label htmlFor={`investment-name-${row.id}`} className="mb-1 block text-xs font-medium text-slate-700">
              Name
            </label>
            <input
              id={`investment-name-${row.id}`}
              name="name"
              type="text"
              defaultValue={row.name}
              required
              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
            />
            {state.fieldErrors?.name ? (
              <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`investment-type-${row.id}`} className="mb-1 block text-xs font-medium text-slate-700">
              Type
            </label>
            <input
              id={`investment-type-${row.id}`}
              name="type"
              type="text"
              defaultValue={row.account_type}
              required
              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
            />
            {state.fieldErrors?.type ? (
              <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.type}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="h-8 self-end rounded bg-slate-900 px-3 text-xs font-medium text-white disabled:opacity-70"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </form>

        {state.message ? (
          <p
            className={`mt-1 text-[11px] ${
              state.fieldErrors ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </td>
      <td className="px-3 py-2 align-top text-right text-sm">
        <div className="mt-6 flex flex-col items-end gap-1">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2">
              <form action={deleteAction} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="h-8 rounded border border-rose-300 px-2.5 text-xs font-medium text-rose-700 disabled:opacity-70"
                >
                  {deletePending ? "Removing..." : "Confirm"}
                </button>
              </form>
              <button
                type="button"
                disabled={deletePending}
                onClick={() => setIsConfirmingDelete(false)}
                className="h-8 rounded border border-slate-300 px-2.5 text-xs font-medium text-slate-700 disabled:opacity-70"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={deletePending}
              onClick={() => setIsConfirmingDelete(true)}
              className="h-8 rounded border border-rose-300 px-2.5 text-xs font-medium text-rose-700 disabled:opacity-70"
            >
              Remove
            </button>
          )}
        </div>

        {deleteState.message ? (
          <p className="mt-1 text-[11px] text-rose-700">{deleteState.message}</p>
        ) : null}
      </td>
    </tr>
  );
}

export default function InvestmentAccountsTable({
  rows,
}: InvestmentAccountsTableProps) {
  if (!rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
        No investment accounts yet.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <table className="w-full border-collapse">
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Name / Type / Edit
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
