'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { upsertBudget, getBudgetForMonth } from './actions';
import { getCategories } from '../settings/categories/actions';

interface BudgetLine {
  category_id: string;
  amount: number;
}

interface Category {
  id: string;
  name: string;
  tag: string;
}

export function BudgetForm({
  selectedMonth,
  currentMonthStart,
}: {
  selectedMonth: string;
  currentMonthStart: string;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistoricalWarning, setShowHistoricalWarning] = useState(false);

  const isHistorical = new Date(selectedMonth + 'T00:00:00.000Z') < new Date(currentMonthStart + 'T00:00:00.000Z');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      const [categoriesResult, budgetResult] = await Promise.all([
        getCategories(),
        getBudgetForMonth(selectedMonth),
      ]);

      if (!categoriesResult.ok) {
        setError(categoriesResult.error || 'Failed to load categories');
        setLoading(false);
        return;
      }

      if (!budgetResult.ok) {
        setError(budgetResult.error || 'Failed to load budget');
        setLoading(false);
        return;
      }

      const cats = categoriesResult.data || [];
      setCategories(cats);

      const existingLines = budgetResult.data?.lines || [];
      const initialLines = cats.map((cat) => {
        const existing = existingLines.find((l) => l.category_id === cat.id);
        return {
          category_id: cat.id,
          amount: existing?.amount ?? 0,
        };
      });

      setLines(initialLines);
      setLoading(false);
    }

    loadData();
  }, [selectedMonth]);

  const handleAmountChange = (categoryId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLines((prev) =>
      prev.map((line) =>
        line.category_id === categoryId ? { ...line, amount: numValue } : line
      )
    );
  };

  const handleSave = async (confirmedHistorical = false) => {
    if (isHistorical && !confirmedHistorical) {
      setShowHistoricalWarning(true);
      return;
    }

    setSaving(true);
    setError(null);
    setShowHistoricalWarning(false);

    const result = await upsertBudget({
      month_start: selectedMonth,
      lines,
      confirmedHistoricalEdit: confirmedHistorical,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error || 'Failed to save budget');
      return;
    }

    router.refresh();
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value + '-01';
    router.push(`/app/budgets?month=${newMonth}`);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Month</label>
        <input
          type="month"
          value={selectedMonth.substring(0, 7)}
          onChange={handleMonthChange}
          className="border rounded px-3 py-2"
        />
        {isHistorical && (
          <p className="text-sm text-yellow-700 mt-2">
            This is a historical budget (past month). Edits require confirmation.
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showHistoricalWarning && (
        <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded mb-4">
          <p className="font-medium mb-2">
            You are editing a historical budget. This will not affect transactions already recorded.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              disabled={saving}
            >
              Confirm & Save
            </button>
            <button
              onClick={() => setShowHistoricalWarning(false)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {categories.map((cat) => {
          const line = lines.find((l) => l.category_id === cat.id);
          return (
            <div key={cat.id} className="flex items-center gap-4">
              <label className="w-48 text-sm font-medium">
                {cat.name}
                {cat.tag !== 'standard' && (
                  <span className="ml-2 text-xs text-gray-500">({cat.tag})</span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                value={line?.amount ?? 0}
                onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                className="border rounded px-3 py-2 w-32"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Budget'}
        </button>
      </div>
    </div>
  );
}
