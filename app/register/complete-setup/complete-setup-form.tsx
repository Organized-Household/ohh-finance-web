'use client';

import { useState } from 'react';
import { completeSetupAction } from './actions';

interface CompleteSetupFormProps {
  userId: string;
}

export function CompleteSetupForm({ userId }: CompleteSetupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('userId', userId);

    const result = await completeSetupAction(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // On success, the action will redirect
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="alias" className="block text-sm font-medium text-gray-700">
          Household Alias
        </label>
        <input
          type="text"
          id="alias"
          name="alias"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="e.g., Smith Family"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? 'Completing Setup...' : 'Complete Setup'}
      </button>
    </form>
  );
}
