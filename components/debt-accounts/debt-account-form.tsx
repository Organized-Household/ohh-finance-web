"use client";

import { useActionState } from "react";
import { createDebtAccountFormAction } from "@/lib/actions/accounts";
import { initialDebtFormState } from "@/app/app/accounts/debts/form-state";

const inputCls = "h-9 w-full rounded border border-slate-300 bg-white px-2 text-sm placeholder:text-slate-400";
const labelCls = "mb-1 block text-xs font-medium text-slate-700";
const errorCls = "mt-1 text-[11px] text-rose-700";

export default function DebtAccountForm() {
  const [state, formAction, pending] = useActionState(
    createDebtAccountFormAction,
    initialDebtFormState
  );

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-900">Add Debt Account</h2>

      <form action={formAction} className="space-y-2">
        {/* Row 1: Name + Type */}
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_200px]">
          <div>
            <label htmlFor="create-debt-name" className={labelCls}>Name</label>
            <input
              id="create-debt-name"
              name="name"
              type="text"
              required
              placeholder="Name"
              className={inputCls}
            />
            {state.fieldErrors?.name && <p className={errorCls}>{state.fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="create-debt-type" className={labelCls}>Type</label>
            <select
              id="create-debt-type"
              name="account_subtype"
              required
              defaultValue="credit_card"
              className={inputCls}
            >
              <option value="credit_card">Credit Card</option>
              <option value="mortgage">Mortgage</option>
              <option value="heloc">HELOC</option>
              <option value="car_loan">Car Loan</option>
              <option value="personal_loan">Personal Loan</option>
              <option value="other">Other</option>
            </select>
            {state.fieldErrors?.account_subtype && <p className={errorCls}>{state.fieldErrors.account_subtype}</p>}
          </div>
        </div>

        {/* Row 2: Balance Owed + Rate + Add */}
        <div className="grid gap-2 md:grid-cols-[200px_160px_auto]">
          <div>
            <label htmlFor="create-debt-balance" className={labelCls}>Current Balance Owed (optional)</label>
            <input
              id="create-debt-balance"
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
            <label htmlFor="create-debt-rate" className={labelCls}>Interest Rate % (optional)</label>
            <input
              id="create-debt-rate"
              name="interest_rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="e.g. 19.99"
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
