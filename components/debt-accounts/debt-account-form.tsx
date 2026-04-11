"use client";

import { useActionState } from "react";
import { createDebtAccountFormAction } from "@/app/app/accounts/debts/actions";
import { initialDebtAccountFormState } from "@/app/app/accounts/debts/form-state";

export default function DebtAccountForm() {
  const [state, formAction, pending] = useActionState(
    createDebtAccountFormAction,
    initialDebtAccountFormState
  );

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-3">
      <h2 className="text-sm font-semibold text-slate-900">Add Debt Account</h2>

      <form
        action={formAction}
        className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem_auto]"
      >
        <div>
          <label
            htmlFor="create-debt-name"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Name
          </label>
          <input
            id="create-debt-name"
            name="name"
            type="text"
            required
            placeholder="Name"
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="create-debt-type"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Type
          </label>
          <input
            id="create-debt-type"
            name="type"
            type="text"
            required
            placeholder="Credit Card, Mortgage..."
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
          {state.fieldErrors?.type ? (
            <p className="mt-1 text-[11px] text-rose-700">{state.fieldErrors.type}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-8 self-end rounded bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-70"
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
