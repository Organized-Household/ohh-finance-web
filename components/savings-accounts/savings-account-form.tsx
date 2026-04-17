"use client";

import { useActionState } from "react";
import { createSavingsAccountFormAction } from "@/lib/actions/accounts";
import { initialSavingsFormState } from "@/app/app/accounts/savings/form-state";

export default function SavingsAccountForm() {
  const [state, formAction, pending] = useActionState(
    createSavingsAccountFormAction,
    initialSavingsFormState
  );

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-3">
      <h2 className="text-sm font-semibold text-slate-900">Add Savings Account</h2>

      <form
        action={formAction}
        className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[3fr_1fr_1fr_1fr_auto]"
      >
        <div>
          <label htmlFor="create-purpose" className="sr-only">
            Purpose
          </label>
          <input
            id="create-purpose"
            name="name"
            type="text"
            required
            placeholder="Purpose"
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="create-account-number" className="sr-only">
            Account Number (optional)
          </label>
          <input
            id="create-account-number"
            name="account_number"
            type="text"
            inputMode="numeric"
            placeholder="Account # (optional)"
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
          {state.fieldErrors?.account_number ? (
            <p className="mt-1 text-[11px] text-rose-700">
              {state.fieldErrors.account_number}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="create-target-amount" className="sr-only">
            Target Amount (optional)
          </label>
          <input
            id="create-target-amount"
            name="target_amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Target Amount"
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
          {state.fieldErrors?.target_amount ? (
            <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.target_amount}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="create-target-date" className="sr-only">
            Target Date (optional)
          </label>
          <input
            id="create-target-date"
            name="target_date"
            type="date"
            placeholder="Target Date"
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
          {state.fieldErrors?.target_date ? (
            <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.target_date}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-70"
        >
          {pending ? "Adding..." : "Add"}
        </button>
      </form>

      {state.message ? (
        <p
          className={`mt-2 text-xs ${
            state.fieldErrors ? "text-rose-700" : "text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
