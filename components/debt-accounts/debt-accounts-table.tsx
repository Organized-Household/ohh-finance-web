"use client";

import { useActionState, useState } from "react";
import {
  type AccountFormState as DebtFormState,
  deleteDebtAccountFormAction,
  updateDebtAccountFormAction,
} from "@/lib/actions/accounts";
import { initialDebtFormState } from "@/app/app/accounts/debts/form-state";

const SUBTYPE_LABELS: Record<string, string> = {
  credit_card: 'Credit Card',
  mortgage: 'Mortgage',
  heloc: 'HELOC',
  car_loan: 'Car Loan',
  personal_loan: 'Personal Loan',
  other: 'Other',
}

function subtypeLabel(value: string): string {
  return SUBTYPE_LABELS[value] ?? value
}

type DebtAccountRow = {
  id: string;
  name: string;
  account_subtype: string;
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
  const [draftName, setDraftName] = useState(row.name);
  const [draftType, setDraftType] = useState(row.account_subtype);
  const [lastSavedName, setLastSavedName] = useState<string | null>(null);
  const [lastSavedType, setLastSavedType] = useState<string | null>(null);

  const updateActionWithUiState = async (
    prevState: DebtFormState,
    formData: FormData
  ) => {
    const nextState = await updateDebtAccountFormAction(prevState, formData);
    if (nextState.message === "Saved." && !nextState.fieldErrors) {
      setLastSavedName(draftName);
      setLastSavedType(draftType);
      setIsEditing(false);
      setIsConfirmingDelete(false);
    }
    return nextState;
  };

  const [state, updateAction, pending] = useActionState(
    updateActionWithUiState,
    initialDebtFormState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteDebtAccountFormAction,
    initialDebtFormState
  );

  const displayName = lastSavedName ?? row.name;
  const displayType = lastSavedType ?? row.account_subtype;

  return (
    <tr className="border-b border-slate-200">
      <td className="px-3 py-2 align-top text-sm text-slate-900">
        {isEditing ? (
          <input
            id={`debt-name-${row.id}`}
            name={`debt-name-${row.id}`}
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

      <td className="px-3 py-2 align-top text-sm text-slate-700">
        {isEditing ? (
          <select
            id={`debt-type-${row.id}`}
            name={`debt-type-${row.id}`}
            value={draftType}
            onChange={(event) => setDraftType(event.target.value)}
            required
            className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm"
          >
            <option value="credit_card">Credit Card</option>
            <option value="mortgage">Mortgage</option>
            <option value="heloc">HELOC</option>
            <option value="car_loan">Car Loan</option>
            <option value="personal_loan">Personal Loan</option>
            <option value="other">Other</option>
          </select>
        ) : (
          subtypeLabel(displayType)
        )}
      </td>

      <td className="px-3 py-2 align-top text-right text-sm">
        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <form action={updateAction} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="name" value={draftName} />
                <input type="hidden" name="account_subtype" value={draftType} />
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
                onClick={() => {
                  setDraftName(displayName);
                  setDraftType(displayType);
                  setIsEditing(false);
                }}
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
                  setDraftName(displayName);
                  setDraftType(displayType);
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
        {state.fieldErrors?.account_subtype ? (
          <p className="mt-1 text-[11px] text-right text-rose-700">{state.fieldErrors.account_subtype}</p>
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
