"use client";

import { useMemo, useState, useTransition } from "react";
import { upsertBudget } from "@/app/app/budgets/actions";
import GroupedBudgetTable, {
  type GroupedBudgetSection,
} from "@/components/budgets/grouped-budget-table";
import BudgetTotalsFooter from "@/components/budgets/budget-totals-footer";

type Category = {
  id: string;
  name: string;
  tag: "standard" | "savings" | "investment";
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

  function toAmount(value: string | undefined) {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
  }

  const groupedSections = useMemo(() => {
    const incomeCategories = categories.filter(
      (category) => category.category_type === "income"
    );
    const standardCategories = categories.filter(
      (category) =>
        category.category_type === "expense" && category.tag === "standard"
    );
    const savingsCategories = categories.filter(
      (category) => category.tag === "savings"
    );
    const investmentCategories = categories.filter(
      (category) => category.tag === "investment"
    );

    const buildSection = (
      key: GroupedBudgetSection["key"],
      title: string,
      sectionCategories: Category[]
    ): GroupedBudgetSection => {
      const subtotal = sectionCategories.reduce(
        (sum, category) => sum + toAmount(values[category.id]),
        0
      );

      return {
        key,
        title,
        subtotal,
        rows: sectionCategories.map((category) => ({
          id: category.id,
          name: category.name,
          amount: values[category.id] ?? "",
        })),
      };
    };

    return [
      buildSection("income", "Income", incomeCategories),
      buildSection("standard", "Standard", standardCategories),
      buildSection("savings", "Savings", savingsCategories),
      buildSection("investment", "Investment", investmentCategories),
    ];
  }, [categories, values]);

  const totals = useMemo(() => {
    const incomeSubtotal =
      groupedSections.find((section) => section.key === "income")?.subtotal ?? 0;
    const standardSubtotal =
      groupedSections.find((section) => section.key === "standard")?.subtotal ?? 0;
    const savingsSubtotal =
      groupedSections.find((section) => section.key === "savings")?.subtotal ?? 0;
    const investmentSubtotal =
      groupedSections.find((section) => section.key === "investment")?.subtotal ?? 0;

    const totalExpenses =
      standardSubtotal + savingsSubtotal + investmentSubtotal;

    return {
      totalIncome: incomeSubtotal,
      totalExpenses,
      remainingBalance: incomeSubtotal - totalExpenses,
    };
  }, [groupedSections]);

  const hasChanges = useMemo(() => {
    const allIds = new Set([
      ...Object.keys(initialValues),
      ...Object.keys(values),
    ]);

    for (const id of allIds) {
      const current = values[id] ?? "";
      const initial = initialValues[id] ?? "";

      if (current !== initial) {
        return true;
      }
    }

    return false;
  }, [initialValues, values]);

  function updateValue(categoryId: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [categoryId]: value,
    }));
  }

  function handleDiscard() {
    setValues(initialValues);
    setMessage("");
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
    <div className="space-y-6">
      {message ? (
        <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
          {message}
        </div>
      ) : null}

      <GroupedBudgetTable sections={groupedSections} onAmountChange={updateValue} />

      <BudgetTotalsFooter
        totalIncome={totals.totalIncome}
        totalExpenses={totals.totalExpenses}
        remainingBalance={totals.remainingBalance}
      />

      <div className="sticky bottom-4 z-10">
        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Budget for {month}</p>
            <p className="text-xs text-gray-600">
              {hasChanges
                ? "You have unsaved changes."
                : "No unsaved changes."}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!hasChanges || isPending}
              className="rounded border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isPending}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
