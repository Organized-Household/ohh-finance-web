"use client";

import { useActionState } from "react";
import { createInvestmentAccountFormAction } from "@/lib/actions/accounts";
import { initialInvestmentFormState } from "@/app/app/accounts/investments/form-state";

const inputCls = "h-9 w-full rounded border border-slate-300 bg-white px-2 text-sm placeholder:text-slate-400";
const labelCls = "mb-1 block text-xs font-medium text-slate-700";
const errorCls = "mt-1 text-[11px] text-rose-700";

export default function InvestmentAccountForm() {
  const [state, formAction, pending] = useActionState(
    createInvestmentAccountFormAction,
    initialInvestmentFormState
  );

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-900">Add Investment Account</h2>

      <form action={formAction} className="space-y-2">
        {/* Row 1: Name + Type */}
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px]">
          <div>
            <label htmlFor="create-investment-name" className={labelCls}>Name</label>
            <input
              id="create-investment-name"
              name="name"
              type="text"
              required
              placeholder="Name"
              className={inputCls}
            />
            {state.fieldErrors?.name && <p className={errorCls}>{state.fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="create-investment-type" className={labelCls}>Type</label>
            <select
              id="create-investment-type"
              name="account_subtype"
              required
              defaultValue="rrsp"
              className={inputCls}
            >
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
            {state.fieldErrors?.account_subtype && <p className={errorCls}>{state.fieldErrors.account_subtype}</p>}
          </div>
        </div>

        {/* Row 2: Balance + Rate + Add */}
        <div className="grid gap-2 md:grid-cols-[180px_160px_auto]">
          <div>
            <label htmlFor="create-investment-balance" className={labelCls}>Current Balance (optional)</label>
            <input
              id="create-investment-balance"
              name="opening_balance"
              type="number"
              min="0"
              step="0.01"
              placeholder="optional"
              className={inputCls}
            />
            {state.fieldErrors?.opening_balance && <p className={errorCls}>{state.fieldErrors.opening_balance}</p>}
          </div>

          <div>
            <label htmlFor="create-investment-rate" className={labelCls}>Interest Rate % (optional)</label>
            <input
              id="create-investment-rate"
              name="interest_rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="e.g. 4.89"
              className={inputCls}
            />
            {state.fieldErrors?.interest_rate && <p className={errorCls}>{state.fieldErrors.interest_rate}</p>}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="h-9 self-end rounded bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-70"
          >
            {pending ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      {state.message && (
        <p className={`mt-2 text-xs ${state.fieldErrors ? "text-rose-700" : "text-emerald-700"}`}>
          {state.message}
        </p>
      )}
    </section>
  );
}
