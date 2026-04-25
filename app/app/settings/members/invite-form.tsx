"use client";

import { useActionState } from "react";
import { inviteMember } from "./actions";

export default function InviteForm() {
  const [state, formAction, isPending] = useActionState(inviteMember, null);

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500";
  const labelCls = "block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="max-w-sm space-y-4 rounded-lg border border-slate-300 bg-white p-4">
      {state?.error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Invitation sent successfully.
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className={labelCls}>
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={isPending}
          className={inputCls}
          placeholder="name@example.com"
          autoComplete="off"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="role" className={labelCls}>
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue="member"
          disabled={isPending}
          className={inputCls}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send Invite"}
      </button>
    </form>
  );
}
