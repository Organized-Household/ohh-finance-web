"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertBudget,
  copyBudgetFromMonth,
} from "@/app/app/budgets/actions";
import GroupedBudgetTable, {
  type GroupedBudgetSection,
} from "@/components/budgets/grouped-budget-table";
import BudgetTotalsFooter from "@/components/budgets/budget-totals-footer";

type Category = {
  id: string;
  name: string;
  tag: string;
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
  isHistoricalMonth: boolean;
  latestBudget: { monthStart: string; monthLabel: string } | null;
  hasExistingBudget: boolean;
  currentMonthStart: string;
  activeMemberId: string;
};

export default function BudgetTable({
  categories,
  month,
  initialLines,
  isHistoricalMonth,
  latestBudget,
  hasExistingBudget,
  currentMonthStart,
  activeMemberId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");
  const [copyError, setCopyError] = useState<string | null>(null);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Show whenever there is any prior budget to copy from.
  // getLatestBudgetMonth already excludes the current month server-side,
  // so latestBudget is always a prior month when non-null.
  const showCopyButton = latestBudget !== null;

  const initialValues = useMemo(() => {
    const map: Record<string, string> = {};

    for (const line of initialLines) {
      map[line.category_id] = String(line.amount);
    }

    return map;
  }, [initialLines]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  // When initialLines changes (e.g. after router.refresh() following a copy),
  // sync values so the table displays the newly copied amounts immediately.
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);
  const [historicalEditingEnabled, setHistoricalEditingEnabled] = useState(
    !isHistoricalMonth
  );
  const isReadOnly = isHistoricalMonth && !historicalEditingEnabled;

  function toAmount(value: string | undefined) {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
  }

  const groupedSections = useMemo(() => {
    const buildSection = (
      key: string,
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

    const incomeSection = buildSection(
      "income",
      "Income",
      categories.filter((c) => c.category_type === "income")
    );

    // Collect unique expense tags in the order they first appear (server sorts by tag)
    const seenTags = new Set<string>();
    const expenseTags: string[] = [];
    for (const c of categories) {
      if (c.category_type === "expense" && !seenTags.has(c.tag)) {
        seenTags.add(c.tag);
        expenseTags.push(c.tag);
      }
    }

    const expenseSections = expenseTags.map((tag) =>
      buildSection(
        tag,
        tag.charAt(0).toUpperCase() + tag.slice(1).replace(/_/g, " "),
        categories.filter((c) => c.category_type === "expense" && c.tag === tag)
      )
    );

    return [incomeSection, ...expenseSections];
  }, [categories, values]);

  const totals = useMemo(() => {
    const incomeSubtotal =
      groupedSections.find((section) => section.key === "income")?.subtotal ?? 0;
    const totalExpenses = groupedSections
      .filter((section) => section.key !== "income")
      .reduce((sum, section) => sum + section.subtotal, 0);

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
    if (isReadOnly) {
      return;
    }

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
    if (isReadOnly) {
      return;
    }

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

  async function handleCopy() {
    if (!latestBudget || isCopying) return;
    setCopyError(null);
    setShowCopyConfirm(false);
    setIsCopying(true);
    try {
      const result = await copyBudgetFromMonth(
        latestBudget.monthStart,
        currentMonthStart,
        activeMemberId
      );
      if (result.error) {
        setCopyError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div className="space-y-6">
      {isHistoricalMonth ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              This is a historical month. Budgets are view-only until you enable
              editing for this month.
            </p>
            {!historicalEditingEnabled ? (
              <button
                type="button"
                onClick={() => setHistoricalEditingEnabled(true)}
                className="rounded border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900"
              >
                Enable Editing
              </button>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Editing enabled
              </span>
            )}
          </div>
        </section>
      ) : null}

      {message ? (
        <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
          {message}
        </div>
      ) : null}

      <GroupedBudgetTable
        sections={groupedSections}
        onAmountChange={updateValue}
        inputsDisabled={isReadOnly}
      />

      <BudgetTotalsFooter
        totalIncome={totals.totalIncome}
        totalExpenses={totals.totalExpenses}
        remainingBalance={totals.remainingBalance}
      />

      <div className="sticky bottom-4 z-10">
        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          {/* Left zone: label + copy control */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium leading-none">Budget for {month}</span>

              {/* Copy button / inline confirmation — vertically centred with label */}
              {showCopyButton && latestBudget && (
                !showCopyConfirm ? (
                  <button
                    type="button"
                    disabled={isCopying || isPending}
                    onClick={() => {
                      if (hasExistingBudget) {
                        setShowCopyConfirm(true);
                      } else {
                        void handleCopy();
                      }
                    }}
                    className="rounded border px-3 py-1 text-sm font-medium leading-none disabled:opacity-50"
                  >
                    {isCopying ? "Copying..." : `Copy from ${latestBudget.monthLabel}`}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none text-amber-600">
                      Overwrite with {latestBudget.monthLabel} budget?
                    </span>
                    <button
                      type="button"
                      disabled={isCopying}
                      onClick={() => void handleCopy()}
                      className="text-sm font-medium leading-none text-green-600 hover:text-green-800 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={isCopying}
                      onClick={() => setShowCopyConfirm(false)}
                      className="text-sm leading-none text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )
              )}
            </div>

            <p className="mt-1 text-xs text-gray-600">
              {hasChanges ? "You have unsaved changes." : "No unsaved changes."}
            </p>
            {copyError ? (
              <p className="mt-1 text-xs text-rose-700">{copyError}</p>
            ) : null}
          </div>

          {/* Right zone: Discard + Save */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!hasChanges || isPending || isReadOnly}
              className="rounded border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isPending || isReadOnly}
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
