"use client";

import { useActionState, useState } from "react";
import {
  type AccountFormState as SavingsFormState,
  deleteSavingsAccountFormAction,
  updateSavingsAccountFormAction,
} from "@/lib/actions/accounts";
import { initialSavingsFormState } from "@/app/app/accounts/savings/form-state";
import type { SavingsAccountRow } from "@/app/app/accounts/savings/page";

type SavingsAccountsTableProps = {
  rows: SavingsAccountRow[];
};

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatLast4(last4: string | null) {
  return last4 ? `**** ${last4}` : "—";
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

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputCls = "h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm";
const errorCls = "mt-1 text-[11px] text-rose-700 text-right";

// ---------------------------------------------------------------------------
// EditableRow
// ---------------------------------------------------------------------------

type EditableRowProps = { row: SavingsAccountRow };

function EditableRow({ row }: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [draftName, setDraftName] = useState(row.name);
  const [draftAccNum, setDraftAccNum] = useState(row.account_number_last4 ?? "");
  const [draftBalance, setDraftBalance] = useState(row.opening_balance != null ? String(row.opening_balance) : "");
  const [draftRate, setDraftRate] = useState(
    row.interest_rate != null ? String((row.interest_rate * 100).toFixed(2)) : ""
  );
  const [draftTargetAmount, setDraftTargetAmount] = useState(
    row.target_amount != null ? row.target_amount.toFixed(2) : ""
  );
  const [draftTargetDate, setDraftTargetDate] = useState(row.target_date ?? "");
  const [lastSaved, setLastSaved] = useState<SavingsAccountRow | null>(null);

  const updateActionWithUiState = async (prevState: SavingsFormState, formData: FormData) => {
    const nextState = await updateSavingsAccountFormAction(prevState, formData);
    if (nextState.message === "Saved." && !nextState.fieldErrors) {
      setLastSaved({
        ...row,
        name: draftName,
        account_number_last4: draftAccNum ? draftAccNum.slice(-4) : null,
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

  const [state, updateAction, pending] = useActionState(updateActionWithUiState, initialSavingsFormState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSavingsAccountFormAction, initialSavingsFormState);

  const d: SavingsAccountRow = lastSaved ?? row;

  function cancelEdit() {
    setDraftName(d.name);
    setDraftAccNum(d.account_number_last4 ?? "");
    setDraftBalance(d.opening_balance != null ? String(d.opening_balance) : "");
    setDraftRate(d.interest_rate != null ? String((d.interest_rate * 100).toFixed(2)) : "");
    setDraftTargetAmount(d.target_amount != null ? d.target_amount.toFixed(2) : "");
    setDraftTargetDate(d.target_date ?? "");
    setIsEditing(false);
  }

  return (
    <tr className="border-b border-slate-200">
      {/* Purpose */}
      <td className="px-3 py-2 align-top text-[13px] text-slate-900">
        {isEditing ? (
          <input value={draftName} onChange={(e) => setDraftName(e.target.value)} required className={inputCls} />
        ) : d.name}
      </td>

      {/* Current Balance */}
      <td className="px-3 py-2 align-top text-right text-[13px] tabular-nums text-slate-700">
        {isEditing ? (
          <input type="number" min="0" step="0.01" value={draftBalance} onChange={(e) => setDraftBalance(e.target.value)} placeholder="optional" className={inputCls} />
        ) : formatCurrency(d.opening_balance)}
      </td>

      {/* Interest Rate */}
      <td className="px-3 py-2 align-top text-right text-[13px] tabular-nums text-slate-700">
        {isEditing ? (
          <input type="number" min="0" max="100" step="0.01" value={draftRate} onChange={(e) => setDraftRate(e.target.value)} placeholder="e.g. 4.89" className={inputCls} />
        ) : formatRate(d.interest_rate)}
      </td>

      {/* Target Amount */}
      <td className="px-3 py-2 align-top text-right text-[13px] tabular-nums text-slate-700">
        {isEditing ? (
          <input type="number" min="0" step="0.01" value={draftTargetAmount} onChange={(e) => setDraftTargetAmount(e.target.value)} placeholder="optional" className={inputCls} />
        ) : formatCurrency(d.target_amount)}
      </td>

      {/* Target Date */}
      <td className="px-3 py-2 align-top text-right text-[13px] text-slate-700">
        {isEditing ? (
          <input type="date" value={draftTargetDate} onChange={(e) => setDraftTargetDate(e.target.value)} className={inputCls} />
        ) : formatDate(d.target_date)}
      </td>

      {/* Account # */}
      <td className="px-3 py-2 align-top text-right text-[13px] tabular-nums text-slate-500">
        {isEditing ? (
          <input type="text" inputMode="numeric" value={draftAccNum} onChange={(e) => setDraftAccNum(e.target.value)} placeholder="optional" className={inputCls} />
        ) : formatLast4(d.account_number_last4)}
      </td>

      {/* Actions */}
      <td className="px-3 py-2 align-top text-right text-[13px]">
        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <form action={updateAction} className="inline">
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="name" value={draftName} />
              <input type="hidden" name="account_number" value={draftAccNum} />
              <input type="hidden" name="opening_balance" value={draftBalance} />
              <input type="hidden" name="interest_rate" value={draftRate} />
              <input type="hidden" name="target_amount" value={draftTargetAmount} />
              <input type="hidden" name="target_date" value={draftTargetDate} />
              <button type="submit" disabled={pending} className="h-7 rounded bg-slate-900 px-2 text-xs font-medium text-white disabled:opacity-70">
                {pending ? "Saving..." : "Save"}
              </button>
            </form>
            <button type="button" disabled={pending} onClick={cancelEdit} className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700 disabled:opacity-70">
              Cancel
            </button>
          </div>
        ) : isConfirmingDelete ? (
          <div className="flex items-center justify-end gap-2">
            <form action={deleteAction} className="inline">
              <input type="hidden" name="id" value={row.id} />
              <button type="submit" disabled={deletePending} className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700 disabled:opacity-70">
                {deletePending ? "Removing..." : "Confirm"}
              </button>
            </form>
            <button type="button" disabled={deletePending} onClick={() => setIsConfirmingDelete(false)} className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700 disabled:opacity-70">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => { setIsConfirmingDelete(false); setIsEditing(true); }} className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700">Edit</button>
            <button type="button" onClick={() => { setIsEditing(false); setIsConfirmingDelete(true); }} className="h-7 rounded border border-rose-300 px-2 text-xs font-medium text-rose-700">Remove</button>
          </div>
        )}
        {state.fieldErrors?.name && <p className={errorCls}>{state.fieldErrors.name}</p>}
        {state.fieldErrors?.opening_balance && <p className={errorCls}>{state.fieldErrors.opening_balance}</p>}
        {state.fieldErrors?.interest_rate && <p className={errorCls}>{state.fieldErrors.interest_rate}</p>}
        {state.fieldErrors?.target_amount && <p className={errorCls}>{state.fieldErrors.target_amount}</p>}
        {state.fieldErrors?.account_number && <p className={errorCls}>{state.fieldErrors.account_number}</p>}
        {state.message && !state.fieldErrors && <p className="mt-1 text-right text-[11px] text-emerald-700">{state.message}</p>}
        {deleteState.message && <p className="mt-1 text-right text-[11px] text-rose-700">{deleteState.message}</p>}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export default function SavingsAccountsTable({ rows }: SavingsAccountsTableProps) {
  if (!rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-6 text-center text-[13px] text-slate-500">
        No savings accounts yet. Add one above.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <table className="min-w-[640px] w-full table-fixed border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "auto" }} />       {/* Purpose — flex */}
          <col style={{ width: "120px" }} />      {/* Current Balance */}
          <col style={{ width: "90px" }} />       {/* Interest Rate */}
          <col style={{ width: "120px" }} />      {/* Target Amount */}
          <col style={{ width: "120px" }} />      {/* Target Date */}
          <col style={{ width: "100px" }} />      {/* Account # */}
          <col style={{ width: "110px" }} />      {/* Actions */}
        </colgroup>
        <thead style={{ background: "#1e293b", color: "#fff" }}>
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide">Purpose</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Current Balance</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Rate</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Target Amount</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Target Date</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Account #</th>
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
