"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";

type ProfileFormProps = {
  initialFirstName: string;
  initialLastName: string;
  initialHouseholdName: string;
  email: string;
  isAdmin: boolean;
};

export default function ProfileForm({
  initialFirstName,
  initialLastName,
  initialHouseholdName,
  email,
  isAdmin,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500";
  const labelCls = "block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      {state?.error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Profile saved successfully.
        </div>
      )}

      {isAdmin && (
        <div className="space-y-1">
          <label htmlFor="household_name" className={labelCls}>
            Household Name
          </label>
          <input
            id="household_name"
            name="household_name"
            type="text"
            required
            defaultValue={initialHouseholdName}
            disabled={isPending}
            className={inputCls}
            autoComplete="off"
          />
          <p className="text-xs text-slate-500">
            This name is shown to all household members. Only admins can change it.
          </p>
        </div>
      )}

      {!isAdmin && (
        <input
          type="hidden"
          name="household_name"
          value={initialHouseholdName}
        />
      )}

      <div className="space-y-1">
        <label htmlFor="first_name" className={labelCls}>
          First Name
        </label>
        <input
          id="first_name"
          name="first_name"
          type="text"
          required
          defaultValue={initialFirstName}
          disabled={isPending}
          className={inputCls}
          autoComplete="given-name"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="last_name" className={labelCls}>
          Last Name
        </label>
        <input
          id="last_name"
          name="last_name"
          type="text"
          required
          defaultValue={initialLastName}
          disabled={isPending}
          className={inputCls}
          autoComplete="family-name"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className={labelCls}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          disabled
          readOnly
          className={inputCls}
          autoComplete="email"
        />
        <p className="text-xs text-slate-500">
          Email is managed through your account and cannot be changed here.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
