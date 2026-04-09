"use client";

import { useMemo, useState, useTransition } from "react";
import { upsertBudget } from "@/app/app/budgets/actions";

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

type TagKey = "standard" | "savings" | "investment";
type CategoryTypeKey = "income" | "expense";

const TAG_ORDER: TagKey[] = ["standard", "savings", "investment"];
const CATEGORY_TYPE_ORDER: CategoryTypeKey[] = ["income", "expense"];

const TAG_LABELS: Record<TagKey, string> = {
  standard: "Standard",
  savings: "Savings",
  investment: "Investment",
};

const TAG_HELPER_TEXT: Record<TagKey, string> = {
  standard: "Everyday categories",
  savings: "Money set aside for a goal or future use",
  investment: "Money planned for long-term growth",
};

const SECTION_LABELS: Record<CategoryTypeKey, string> = {
  income: "Income",
  expense: "Expense",
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

  const groupedCategories = useMemo(() => {
    const result: Record<
      CategoryTypeKey,
      Record<TagKey, Category[]>
    > = {
      income: {
        standard: [],
        savings: [],
        investment: [],
      },
      expense: {
        standard: [],
        savings: [],
        investment: [],
      },
    };

    for (const category of categories) {
      result[category.category_type][category.tag].push(category);
    }

    return result;
  }, [categories]);

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

      <div className="grid gap-6 xl:grid-cols-2">
        {CATEGORY_TYPE_ORDER.map((categoryType) => {
          const sectionGroups = groupedCategories[categoryType];
          const hasAnyRows = TAG_ORDER.some(
            (tag) => sectionGroups[tag].length > 0
          );

          if (!hasAnyRows) {
            return null;
          }

          return (
            <section
              key={categoryType}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-semibold">
                  {SECTION_LABELS[categoryType]}
                </h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600">
                  {sectionGroups.standard.length +
                    sectionGroups.savings.length +
                    sectionGroups.investment.length}{" "}
                  categories
                </span>
              </div>

              <div className="space-y-6">
                {TAG_ORDER.map((tag) => {
                  const tagCategories = sectionGroups[tag];

                  if (!tagCategories.length) {
                    return null;
                  }

                  return (
                    <div key={tag} className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">
                            {TAG_LABELS[tag]}
                          </h3>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            {tagCategories.length}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {TAG_HELPER_TEXT[tag]}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {tagCategories.map((category) => (
                          <div
                            key={category.id}
                            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-medium">{category.name}</p>
                              <p className="text-xs text-gray-500 capitalize">
                                {category.category_type}
                              </p>
                            </div>

                            <div className="w-full sm:w-40">
                              <label
                                htmlFor={`amount-${category.id}`}
                                className="mb-1 block text-xs font-medium text-gray-600"
                              >
                                Amount
                              </label>
                              <input
                                id={`amount-${category.id}`}
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                value={values[category.id] ?? ""}
                                onChange={(e) =>
                                  updateValue(category.id, e.target.value)
                                }
                                className="w-full rounded border px-3 py-2 text-right"
                                aria-label={`Planned amount for ${category.name}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

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
