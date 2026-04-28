"use client";

import { useActionState, useState } from "react";
import {
  type AccountFormState as DebtFormState,
  deleteDebtAccountFormAction,
  updateDebtAccountFormAction,
} from "@/lib/actions/accounts";
import { initialDebtFormState } from "@/app/app/accounts/debts/form-state";
import type { DebtAccountRow } from "@/app/app/accounts/debts/page";

type DebtAccountsTableProps = {
  rows: DebtAccountRow[];
};

// ---------------------------------------------------------------------------
// Labels & formatters
// ---------------------------------------------------------------------------

const SUBTYPE_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  mortgage: "Mortgage",
  heloc: "HELOC",
  car_loan: "Car Loan",
  personal_loan: "Personal Loan",
  other: "Other",
};

function subtypeLabel(value: string): string {
  return SUBTYPE_LABELS[value] ?? value;
}

function formatCurrency(amount: number | null) {
  if (amount === null || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRate(rate: number | null) {
  if (rate === null || !Number.isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(2)}%`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "—";
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const inputCls = "h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm";
const errorCls = "mt-1 text-[11px] text-rose-700 text-right";

// ---------------------------------------------------------------------------
// EditableRow
// ---------------------------------------------------------------------------

type EditableRowProps = { row: DebtAccountRow };

function EditableRow({ row }: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [draftName, setDraftName] = useState(row.name);
  const [draftType, setDraftType] = useState(row.account_subtype);
  const [draftBalance, setDraftBalance] = useState(row.opening_balance != null ? String(row.opening_balance) : "");
  const [draftRate, setDraftRate] = useState(
    row.interest_rate != null ? String((row.interest_rate * 100).toFixed(2)) : ""
  );
  const [draftTargetAmount, setDraftTargetAmount] = useState(row.target_amount != null ? String(row.target_amount) : "");
  const [draftTargetDate, setDraftTargetDate] = useState(row.target_date ?? "");
  const [lastSaved, setLastSaved] = useState<DebtAccountRow | null>(null);

  const updateActionWithUiState = async (prevState: DebtFormState, formData: FormData) => {
    const nextState = await updateDebtAccountFormAction(prevState, formData);
    if (nextState.message === "Saved." && !nextState.fieldErrors) {
      setLastSaved({
        ...row,
        name: draftName,
        account_subtype: draftType,
        opening_balance: draftBalance ? Number.parseFloat(draftBalance) : null,
        interest_rate: draftRate ? Number.parseFloat(draftRate) / 100 : null,
        target_amount: draftTargetAmount ? Number.parseFloat(draftTargetAmount) : null,
        target_date: draftTargetDate || null,
      });
      setIsEditing(false);
      setIsConfirmingDelete(false);
    }
    return nextState;
  };

  const [state, updateAction, pending] = useActionState(updateActionWithUiState, initialDebtFormState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteDebtAccountFormAction, initialDebtFormState);

  const d: DebtAccountRow = lastSaved ?? row;

  return (
    <tr className="border-b border-slate-200">
      {/* Name */}
      <td className="px-3 py-2 align-top text-[13px] text-slate-900">
        {isEditing ? (
          <input value={draftName} onChange={(e) => setDraftName(e.target.value)} required className={inputCls} />
        ) : d.name}
      </td>

      {/* Type */}
      <td className="px-3 py-2 align-top text-[13px] text-slate-700">
        {isEditing ? (
          <select value={draftType} onChange={(e) => setDraftType(e.target.value)} className={inputCls}>
            <option value="credit_card">Credit Card</option>
            <option value="mortgage">Mortgage</option>
            <option value="heloc">HELOC</option>
            <option value="car_loan">Car Loan</option>
            <option value="personal_loan">Personal Loan</option>
            <option value="other">Other</option>
          </select>
        ) : subtypeLabel(d.account_subtype)}
      </td>

      {/* Balance Owed */}
      <td className="px-3 py-2 align-top text-right text-[13px] tabular-nums text-slate-700">
        {isEditing ? (
          <input type="number" min="0" step="0.01" value={draftBalance} onChange={(e) => setDraftBalance(e.target.value)} placeholder="optional" className={inputCls} />
        ) : formatCurrency(d.opening_balance)}
      </td>

      {/* Interest Rate */}
      <td className="px-3 py-2 align-top text-right text-[13px] tabular-nums text-slate-700">
        {isEditing ? (
          <input type="number" min="0" max="100" step="0.01" value={draftRate} onChange={(e) => setDraftRate(e.target.value)} placeholder="e.g. 19.99" className={inputCls} />
        ) : formatRate(d.interest_rate)}
      </td>

      {/* Target Amount */}
      <td className="px-3 py-2 align-top text-right text-[13px] tabular-nums text-slate-700">
        {isEditing ? (
          <input type="number" min="0" step="0.01" value={draftTargetAmount} onChange={(e) => setDraftTargetAmount(e.target.value)} placeholder="optional" className={inputCls} />
        ) : formatCurrency(d.target_amount)}
      </td>

      {/* Target Date */}
      <td className="px-3 py-2 align-top text-right text-[13px] tabular-nums text-slate-700">
        {isEditing ? (
          <input type="date" value={draftTargetDate} onChange={(e) => setDraftTargetDate(e.target.value)} className={inputCls} />
        ) : formatDate(d.target_date)}
      </td>

      {/* Actions */}
      <td className="px-3 py-2 align-top text-right text-[13px]">
        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <form action={updateAction} className="inline">
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="name" value={draftName} />
              <input type="hidden" name="account_subtype" value={draftType} />
              <input type="hidden" name="opening_balance" value={draftBalance} />
              <input type="hidden" name="interest_rate" value={draftRate} />
              <input type="hidden" name="target_amount" value={draftTargetAmount} />
              <input type="hidden" name="target_date" value={draftTargetDate} />
              <button type="submit" disabled={pending} className="h-7 rounded bg-slate-900 px-2 text-xs font-medium text-white disabled:opacity-70">
                {pending ? "Saving..." : "Save"}
              </button>
            </form>
            <button type="button" disabled={pending} onClick={() => { setDraftName(d.name); setDraftType(d.account_subtype); setDraftBalance(d.opening_balance != null ? String(d.opening_balance) : ""); setDraftRate(d.interest_rate != null ? String((d.interest_rate * 100).toFixed(2)) : ""); setDraftTargetAmount(d.target_amount != null ? String(d.target_amount) : ""); setDraftTargetDate(d.target_date ?? ""); setIsEditing(false); }} className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700 disabled:opacity-70">Cancel</button>
          </div>
        ) : isConfirmingDelete ? (
          <div className="flex items-center justify-end gap-2">
            <form action={deleteAction} className="inline">
              <input type="hidden" name="id" value={row.id} />
              <button type="submit" disabled={deletePending} className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700 disabled:opacity-70">
                {deletePending ? "Removing..." : "Confirm"}
              </button>
            </form>
            <button type="button" disabled={deletePending} onClick={() => setIsConfirmingDelete(false)} className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700 disabled:opacity-70">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => { setIsConfirmingDelete(false); setIsEditing(true); }} className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700">Edit</button>
            <button type="button" onClick={() => { setIsEditing(false); setIsConfirmingDelete(true); }} className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700">Remove</button>
          </div>
        )}
        {state.fieldErrors?.name && <p className={errorCls}>{state.fieldErrors.name}</p>}
        {state.fieldErrors?.account_subtype && <p className={errorCls}>{state.fieldErrors.account_subtype}</p>}
        {state.fieldErrors?.opening_balance && <p className={errorCls}>{state.fieldErrors.opening_balance}</p>}
        {state.fieldErrors?.interest_rate && <p className={errorCls}>{state.fieldErrors.interest_rate}</p>}
        {state.fieldErrors?.target_amount && <p className={errorCls}>{state.fieldErrors.target_amount}</p>}
        {state.fieldErrors?.target_date && <p className={errorCls}>{state.fieldErrors.target_date}</p>}
        {state.message && !state.fieldErrors && <p className="mt-1 text-right text-[11px] text-emerald-700">{state.message}</p>}
        {deleteState.message && <p className="mt-1 text-right text-[11px] text-rose-700">{deleteState.message}</p>}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export default function DebtAccountsTable({ rows }: DebtAccountsTableProps) {
  if (!rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-6 text-center text-[13px] text-slate-500">
        No debt accounts yet. Add one above.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <table className="min-w-[640px] w-full border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "auto" }} />     {/* Name — flex */}
          <col style={{ width: "120px" }} />    {/* Type */}
          <col style={{ width: "110px" }} />    {/* Balance Owed */}
          <col style={{ width: "80px" }} />     {/* Rate */}
          <col style={{ width: "110px" }} />    {/* Target Amt */}
          <col style={{ width: "110px" }} />    {/* Target Date */}
          <col style={{ width: "110px" }} />    {/* Actions */}
        </colgroup>
        <thead style={{ background: "#1e293b", color: "#fff" }}>
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide">Name</th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide">Type</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Balance Owed</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Rate</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Target Amt</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Target Date</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Actions</th>
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
