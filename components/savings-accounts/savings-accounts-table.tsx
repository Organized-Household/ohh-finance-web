"use client";

import { useActionState } from "react";
import {
  deleteSavingsAccountFormAction,
  updateSavingsAccountFormAction,
} from "@/app/app/accounts/savings/actions";
import { initialSavingsAccountFormState } from "@/app/app/accounts/savings/form-state";

type SavingsAccountRow = {
  id: string;
  purpose: string;
  account_number_last4: string | null;
};

type SavingsAccountsTableProps = {
  rows: SavingsAccountRow[];
};

function formatLast4(last4: string | null) {
  if (!last4) {
    return "—";
  }

  return `•••• ${last4}`;
}

type EditableRowProps = {
  row: SavingsAccountRow;
};

function EditableRow({ row }: EditableRowProps) {
  const [state, updateAction, pending] = useActionState(
    updateSavingsAccountFormAction,
    initialSavingsAccountFormState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteSavingsAccountFormAction,
    initialSavingsAccountFormState
  );

  return (
    <tr className="border-b border-slate-200">
      <td className="px-3 py-2 align-top text-sm text-slate-900">
        <form action={updateAction} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <input type="hidden" name="id" value={row.id} />

          <div>
            <label htmlFor={`purpose-${row.id}`} className="sr-only">
              Purpose
            </label>
            <input
              id={`purpose-${row.id}`}
              name="purpose"
              type="text"
              defaultValue={row.purpose}
              required
              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
            />
            {state.fieldErrors?.purpose ? (
              <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.purpose}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`account-number-${row.id}`} className="sr-only">
              Account Number (optional)
            </label>
            <input
              id={`account-number-${row.id}`}
              name="account_number"
              type="text"
              inputMode="numeric"
              defaultValue={row.account_number_last4 ?? ""}
              placeholder="Account # (optional)"
              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
            />
            {state.fieldErrors?.account_number ? (
              <p className="mt-1 text-[11px] text-rose-700">
                {state.fieldErrors.account_number}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="h-8 rounded bg-slate-900 px-3 text-xs font-medium text-white disabled:opacity-70"
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
      <td className="px-3 py-2 align-top text-sm text-slate-700">
        {formatLast4(row.account_number_last4)}
      </td>
      <td className="px-3 py-2 align-top text-right text-sm">
        <form action={deleteAction} className="inline">
          <input type="hidden" name="id" value={row.id} />
          <button
            type="submit"
            disabled={deletePending}
            className="h-8 rounded border border-rose-300 px-2.5 text-xs font-medium text-rose-700 disabled:opacity-70"
            onClick={(event) => {
              const confirmed = window.confirm("Remove this savings account?");
              if (!confirmed) {
                event.preventDefault();
              }
            }}
          >
            {deletePending ? "Removing..." : "Remove"}
          </button>
        </form>

        {deleteState.message ? (
          <p className="mt-1 text-[11px] text-rose-700">{deleteState.message}</p>
        ) : null}
      </td>
    </tr>
  );
}

export default function SavingsAccountsTable({ rows }: SavingsAccountsTableProps) {
  if (!rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
        No savings accounts yet.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <table className="w-full border-collapse">
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Purpose / Edit
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Account
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
