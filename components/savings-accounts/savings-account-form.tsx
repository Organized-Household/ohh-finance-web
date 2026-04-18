"use client";

import { useActionState } from "react";
import { createSavingsAccountFormAction } from "@/lib/actions/accounts";
import { initialSavingsFormState } from "@/app/app/accounts/savings/form-state";

const inputCls = "h-9 w-full rounded border border-slate-300 bg-white px-2 text-sm placeholder:text-slate-400";
const labelCls = "mb-1 block text-xs font-medium text-slate-700";
const errorCls = "mt-1 text-[11px] text-rose-700";

export default function SavingsAccountForm() {
  const [state, formAction, pending] = useActionState(
    createSavingsAccountFormAction,
    initialSavingsFormState
  );

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-900">Add Savings Account</h2>

      <form action={formAction} className="space-y-2">
        {/* Row 1: Purpose + Account # */}
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px]">
          <div>
            <label htmlFor="create-savings-purpose" className={labelCls}>Purpose</label>
            <input
              id="create-savings-purpose"
              name="name"
              type="text"
              required
              placeholder="Purpose"
              className={inputCls}
            />
            {state.fieldErrors?.name && <p className={errorCls}>{state.fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="create-savings-account-number" className={labelCls}>Account # (optional)</label>
            <input
              id="create-savings-account-number"
              name="account_number"
              type="text"
              inputMode="numeric"
              placeholder="optional"
              className={inputCls}
            />
            {state.fieldErrors?.account_number && <p className={errorCls}>{state.fieldErrors.account_number}</p>}
          </div>
        </div>

        {/* Row 2: Balance + Rate + Target Amount + Target Date + Add */}
        <div className="grid gap-2 md:grid-cols-[180px_160px_180px_180px_auto]">
          <div>
            <label htmlFor="create-savings-balance" className={labelCls}>Current Balance (optional)</label>
            <input
              id="create-savings-balance"
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
            <label htmlFor="create-savings-rate" className={labelCls}>Interest Rate % (optional)</label>
            <input
              id="create-savings-rate"
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

          <div>
            <label htmlFor="create-savings-target-amount" className={labelCls}>Target Amount (optional)</label>
            <input
              id="create-savings-target-amount"
              name="target_amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="optional"
              className={inputCls}
            />
            {state.fieldErrors?.target_amount && <p className={errorCls}>{state.fieldErrors.target_amount}</p>}
          </div>

          <div>
            <label htmlFor="create-savings-target-date" className={labelCls}>Target Date (optional)</label>
            <input
              id="create-savings-target-date"
              name="target_date"
              type="date"
              className={inputCls}
            />
            {state.fieldErrors?.target_date && <p className={errorCls}>{state.fieldErrors.target_date}</p>}
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
