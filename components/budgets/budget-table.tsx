"use client";

import { useMemo, useState, useTransition } from "react";
import { upsertBudget } from "@/app/app/budgets/actions";

type Category = {
  id: string;
  name: string;
  category_type: "income" | "expense";
};

type InitialLine = {
  category_id: string;
  amount: number;
};

type Props = {
  categories: Category[];
  month: string;
  initialLines: InitialLine[];
};

export default function BudgetTable({
  categories,
  month,
  initialLines,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  const initialValues = useMemo(() => {
    const map: Record<string, string> = {};

    for (const line of initialLines) {
      map[line.category_id] = String(line.amount);
    }

    return map;
  }, [initialLines]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  function updateValue(categoryId: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [categoryId]: value,
    }));
  }

  function handleSave() {
    setMessage("");

    startTransition(async () => {
      try {
        const lines = categories.map((category) => ({
          category_id: category.id,
          amount: Number(values[category.id] || 0),
        }));

        await upsertBudget({
          month,
          lines,
        });

        setMessage("Budget saved");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save budget";

        setMessage(errorMessage);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Budget for {month}</h2>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>

      {message ? <p className="text-sm">{message}</p> : null}

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">Category</th>
            <th className="py-2 text-left">Type</th>
            <th className="py-2 text-left">Amount</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b">
              <td className="py-2">{category.name}</td>
              <td className="py-2 capitalize">{category.category_type}</td>
              <td className="py-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values[category.id] ?? ""}
                  onChange={(e) => updateValue(category.id, e.target.value)}
                  className="w-full rounded border px-2 py-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}