"use client";

import { useActionState } from "react";
import { createSavingsAccountFormAction } from "@/lib/actions/accounts";
import { initialSavingsFormState } from "@/app/app/accounts/savings/form-state";

const inputCls = "h-9 w-full rounded border border-slate-300 bg-white px-2 text-sm placeholder:text-slate-400";
const errorCls = "mt-1 text-[11px] text-rose-700";
const fieldLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#64748b",
  marginBottom: "4px",
  display: "block",
};
const sectionLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  margin: "12px 0 6px",
};

export default function SavingsAccountForm() {
  const [state, formAction, pending] = useActionState(
    createSavingsAccountFormAction,
    initialSavingsFormState
  );

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-900">Add Savings Account</h2>

      <form action={formAction}>
        {/* Row 1: Purpose + Account # */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "10px" }}>
          <div>
            <label htmlFor="create-savings-purpose" className="mb-1 block text-xs font-medium text-slate-700">
              Purpose
            </label>
            <input
              id="create-savings-purpose"
              name="name"
              type="text"
              required
              placeholder="e.g. Emergency fund"
              className={inputCls}
            />
            {state.fieldErrors?.name && <p className={errorCls}>{state.fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="create-savings-account-number" className="mb-1 block text-xs font-medium text-slate-700">
              Account # (optional)
            </label>
            <input
              id="create-savings-account-number"
              name="account_number"
              type="text"
              inputMode="numeric"
              placeholder="Account # (last 4) — optional"
              className={inputCls}
            />
            {state.fieldErrors?.account_number && <p className={errorCls}>{state.fieldErrors.account_number}</p>}
          </div>
        </div>

        {/* Section label */}
        <p style={sectionLabelStyle}>Financial details (all optional)</p>

        {/* Row 2: 4-column equal grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          <div>
            <label htmlFor="create-savings-balance" style={fieldLabelStyle}>Current balance</label>
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
            <label htmlFor="create-savings-rate" style={fieldLabelStyle}>Interest rate %</label>
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
            <label htmlFor="create-savings-target-amount" style={fieldLabelStyle}>Target amount</label>
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
            <label htmlFor="create-savings-target-date" style={fieldLabelStyle}>Target date</label>
            <input
              id="create-savings-target-date"
              name="target_date"
              type="date"
              className={inputCls}
            />
            {state.fieldErrors?.target_date && <p className={errorCls}>{state.fieldErrors.target_date}</p>}
          </div>
        </div>

        {/* Row 3: Submit button */}
        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "10px",
            background: "#1e293b",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Adding..." : "Add savings account"}
        </button>
      </form>

      {state.message && (
        <p className={`mt-2 text-xs ${state.fieldErrors ? "text-rose-700" : "text-emerald-700"}`}>
          {state.message}
        </p>
      )}
    </section>
  );
}
