import { Fragment } from "react";
import type {
  BudgetVsActualRow,
  BudgetVsActualTableData,
} from "@/lib/dashboard/get-budget-vs-actual";

type BudgetVsActualTableProps = {
  data: BudgetVsActualTableData;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getCategoryAccentClass(row: BudgetVsActualRow) {
  if (row.categoryType === "income") {
    return "text-emerald-700";
  }

  if (row.tag === "savings") {
    return "text-teal-700";
  }

  if (row.tag === "investment") {
    return "text-indigo-700";
  }

  return "text-slate-700";
}

function getVarianceClass(varianceAmount: number) {
  if (varianceAmount > 0) {
    return "text-emerald-700";
  }

  if (varianceAmount < 0) {
    return "text-rose-700";
  }

  return "text-slate-700";
}

const sectionOrder = [
  { key: "income", label: "Income" },
  { key: "standard", label: "Standard" },
  { key: "savings", label: "Savings" },
  { key: "investment", label: "Investment" },
] as const;

export default function BudgetVsActualTable({ data }: BudgetVsActualTableProps) {
  if (!data.rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-600">
        No budget data for this month.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <div className="border-b border-slate-300 bg-slate-50 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Budget vs Actual
        </h2>
      </div>

      <table className="w-full border-collapse">
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Category
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
              Budgeted
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
              Actual
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
              Variance
            </th>
          </tr>
        </thead>

        <tbody>
          {sectionOrder.map((section) => {
            const sectionRows = data.rows.filter((row) => {
              if (section.key === "income") {
                return row.categoryType === "income";
              }

              return row.categoryType === "expense" && row.tag === section.key;
            });

            if (!sectionRows.length) {
              return null;
            }

            return (
              <Fragment key={section.key}>
                <tr key={`${section.key}-header`} className="border-b border-slate-200 bg-slate-100">
                  <td colSpan={4} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {section.label}
                  </td>
                </tr>

                {sectionRows.map((row) => (
                  <tr key={row.categoryId} className="border-b border-slate-200">
                    <td className={`px-3 py-2 text-sm ${getCategoryAccentClass(row)}`}>
                      {row.categoryName}
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums text-slate-700">
                      {formatCurrency(row.budgetedAmount)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums text-slate-700">
                      {formatCurrency(row.actualAmount)}
                    </td>
                    <td className={`px-3 py-2 text-right text-sm font-semibold tabular-nums ${getVarianceClass(row.varianceAmount)}`}>
                      {formatCurrency(row.varianceAmount)}
                    </td>
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="bg-slate-50">
            <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Totals
            </td>
            <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-slate-900">
              {formatCurrency(data.totals.budgetedAmount)}
            </td>
            <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-slate-900">
              {formatCurrency(data.totals.actualAmount)}
            </td>
            <td className={`px-3 py-2 text-right text-sm font-semibold tabular-nums ${getVarianceClass(data.totals.varianceAmount)}`}>
              {formatCurrency(data.totals.varianceAmount)}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
