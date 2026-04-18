"use client";

import { useActionState, useState } from "react";
import {
  type AccountFormState as InvestmentFormState,
  deleteInvestmentAccountFormAction,
  updateInvestmentAccountFormAction,
} from "@/lib/actions/accounts";
import { initialInvestmentFormState } from "@/app/app/accounts/investments/form-state";
import type { InvestmentAccountRow } from "@/app/app/accounts/investments/page";

type InvestmentAccountsTableProps = {
  rows: InvestmentAccountRow[];
};

// ---------------------------------------------------------------------------
// Labels & formatters
// ---------------------------------------------------------------------------

const INVESTMENT_SUBTYPE_LABELS: Record<string, string> = {
  rrsp: "RRSP",
  tfsa: "TFSA",
  stocks: "Stocks",
  etf: "ETF",
  gic: "GIC",
  pension: "Pension",
  gsop: "GSOP",
  rpp: "RPP",
  other: "Other",
};

function subtypeLabel(value: string): string {
  return INVESTMENT_SUBTYPE_LABELS[value] ?? value;
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

const inputCls = "h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm";
const errorCls = "mt-1 text-[11px] text-rose-700 text-right";

// ---------------------------------------------------------------------------
// EditableRow
// ---------------------------------------------------------------------------

type EditableRowProps = { row: InvestmentAccountRow };

function EditableRow({ row }: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [draftName, setDraftName] = useState(row.name);
  const [draftType, setDraftType] = useState(row.account_subtype);
  const [draftBalance, setDraftBalance] = useState(row.opening_balance != null ? String(row.opening_balance) : "");
  const [draftRate, setDraftRate] = useState(
    row.interest_rate != null ? String((row.interest_rate * 100).toFixed(2)) : ""
  );
  const [lastSaved, setLastSaved] = useState<InvestmentAccountRow | null>(null);

  const updateActionWithUiState = async (prevState: InvestmentFormState, formData: FormData) => {
    const nextState = await updateInvestmentAccountFormAction(prevState, formData);
    if (nextState.message === "Saved." && !nextState.fieldErrors) {
      setLastSaved({
        ...row,
        name: draftName,
        account_subtype: draftType,
        opening_balance: draftBalance ? Number.parseFloat(draftBalance) : null,
        interest_rate: draftRate ? Number.parseFloat(draftRate) / 100 : null,
      });
      setIsEditing(false);
      setIsConfirmingDelete(false);
    }
    return nextState;
  };

  const [state, updateAction, pending] = useActionState(updateActionWithUiState, initialInvestmentFormState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteInvestmentAccountFormAction, initialInvestmentFormState);

  const d: InvestmentAccountRow = lastSaved ?? row;

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
            <option value="rrsp">RRSP</option>
            <option value="tfsa">TFSA</option>
            <option value="stocks">Stocks</option>
            <option value="etf">ETF</option>
            <option value="gic">GIC</option>
            <option value="pension">Pension</option>
            <option value="gsop">GSOP</option>
            <option value="rpp">RPP</option>
            <option value="other">Other</option>
          </select>
        ) : subtypeLabel(d.account_subtype)}
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
              <button type="submit" disabled={pending} className="h-7 rounded bg-slate-900 px-2 text-xs font-medium text-white disabled:opacity-70">
                {pending ? "Saving..." : "Save"}
              </button>
            </form>
            <button type="button" disabled={pending} onClick={() => { setDraftName(d.name); setDraftType(d.account_subtype); setDraftBalance(d.opening_balance != null ? String(d.opening_balance) : ""); setDraftRate(d.interest_rate != null ? String((d.interest_rate * 100).toFixed(2)) : ""); setIsEditing(false); }} className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700 disabled:opacity-70">Cancel</button>
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
        {state.message && !state.fieldErrors && <p className="mt-1 text-right text-[11px] text-emerald-700">{state.message}</p>}
        {deleteState.message && <p className="mt-1 text-right text-[11px] text-rose-700">{deleteState.message}</p>}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export default function InvestmentAccountsTable({ rows }: InvestmentAccountsTableProps) {
  if (!rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-6 text-center text-[13px] text-slate-500">
        No investment accounts yet. Add one above.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white">
      <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "auto" }} />     {/* Name — flex */}
          <col style={{ width: "120px" }} />    {/* Type */}
          <col style={{ width: "130px" }} />    {/* Current Balance */}
          <col style={{ width: "100px" }} />    {/* Interest Rate */}
          <col style={{ width: "110px" }} />    {/* Actions */}
        </colgroup>
        <thead style={{ background: "#1e293b", color: "#fff" }}>
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide">Name</th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide">Type</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Current Balance</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide">Rate</th>
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
