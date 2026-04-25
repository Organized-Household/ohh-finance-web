"use client";

import { useActionState } from "react";
import { acceptInvite } from "./actions";

export default function AcceptInviteForm() {
  const [state, formAction, isPending] = useActionState(acceptInvite, null);

  const inputCls =
    "w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-slate-400 focus:outline-none disabled:opacity-50";
  const labelCls = "block text-sm font-medium text-slate-300";

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-slate-700 bg-slate-800 p-6"
    >
      {state?.error && (
        <div className="rounded-md border border-rose-700 bg-rose-900/30 px-3 py-2 text-sm text-rose-300">
          {state.error}
        </div>
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
          disabled={isPending}
          className={inputCls}
          autoComplete="family-name"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className={labelCls}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          disabled={isPending}
          className={inputCls}
          autoComplete="new-password"
        />
        <p className="text-xs text-slate-500">Minimum 8 characters.</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
      >
        {isPending ? "Setting up your account…" : "Complete Registration"}
      </button>
    </form>
  );
}
