import type { IncomeVsExpenseSummary } from "@/lib/dashboard/get-income-vs-expense-summary";

type IncomeVsExpenseSummaryProps = {
  summary: IncomeVsExpenseSummary;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function IncomeVsExpenseSummary({
  summary,
}: IncomeVsExpenseSummaryProps) {
  const differenceClass =
    summary.difference >= 0 ? "text-emerald-700" : "text-rose-700";

  return (
    <section className="rounded-lg border border-slate-300 bg-white px-3 py-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Income
          </p>
          <p className="mt-1 text-base font-semibold tabular-nums text-emerald-700">
            {formatCurrency(summary.incomeTotal)}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Expense
          </p>
          <p className="mt-1 text-base font-semibold tabular-nums text-rose-700">
            {formatCurrency(summary.expenseTotal)}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Difference
          </p>
          <p className={`mt-1 text-base font-semibold tabular-nums ${differenceClass}`}>
            {formatCurrency(summary.difference)}
          </p>
        </div>
      </div>
    </section>
  );
}
