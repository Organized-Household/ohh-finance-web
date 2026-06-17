"use client";

import { useActionState } from "react";
import { createDebtAccountFormAction } from "@/lib/actions/accounts";
import { initialDebtFormState } from "@/app/app/accounts/debts/form-state";

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

export default function DebtAccountForm() {
  const [state, formAction, pending] = useActionState(
    createDebtAccountFormAction,
    initialDebtFormState
  );

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-900">Add Debt Account</h2>

      <form action={formAction}>
        {/* Row 1: Name + Type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "10px" }}>
          <div>
            <label htmlFor="create-debt-name" className="mb-1 block text-xs font-medium text-slate-700">
              Name
            </label>
            <input
              id="create-debt-name"
              name="name"
              type="text"
              required
              placeholder="e.g. Cap One Mastercard"
              className={inputCls}
            />
            {state.fieldErrors?.name && <p className={errorCls}>{state.fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="create-debt-type" className="mb-1 block text-xs font-medium text-slate-700">
              Type
            </label>
            <select
              id="create-debt-type"
              name="account_subtype"
              required
              defaultValue=""
              className={inputCls}
            >
              <option value="">Type *</option>
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

        {/* Section label */}
        <p style={sectionLabelStyle}>Financial details (all optional)</p>

        {/* Row 2: 4-column equal grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          <div>
            <label htmlFor="create-debt-balance" style={fieldLabelStyle}>Balance owed</label>
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
            <label htmlFor="create-debt-rate" style={fieldLabelStyle}>Interest rate %</label>
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

          <div>
            <label htmlFor="create-debt-target-amount" style={fieldLabelStyle}>Target amount</label>
            <input
              id="create-debt-target-amount"
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
            <label htmlFor="create-debt-target-date" style={fieldLabelStyle}>Target date</label>
            <input
              id="create-debt-target-date"
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
          {pending ? "Adding..." : "Add debt account"}
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
