'use client';

import { useActionState } from 'react';
import { completeSetupAction } from './actions';

interface CompleteSetupFormProps {
  userId: string;
}

export function CompleteSetupForm({ userId }: CompleteSetupFormProps) {
  const [state, formAction, isPending] = useActionState(completeSetupAction, null);

  const inputCls =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500';
  const labelCls = 'block text-sm font-medium text-slate-700';

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />

      {state?.error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="alias" className={labelCls}>
          Household Name
        </label>
        <input
          type="text"
          id="alias"
          name="alias"
          required
          disabled={isPending}
          className={inputCls}
          placeholder="e.g., The Smith Family"
        />
        <p className="text-xs text-slate-500">
          This name is shown to all household members.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="first_name" className={labelCls}>
          First Name
        </label>
        <input
          type="text"
          id="first_name"
          name="first_name"
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
          type="text"
          id="last_name"
          name="last_name"
          required
          disabled={isPending}
          className={inputCls}
          autoComplete="family-name"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? 'Setting up your household…' : 'Complete Setup'}
      </button>
    </form>
  );
}
