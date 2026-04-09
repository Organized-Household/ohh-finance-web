type BudgetTotalsFooterProps = {
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function BudgetTotalsFooter({
  totalIncome,
  totalExpenses,
  remainingBalance,
}: BudgetTotalsFooterProps) {
  return (
    <section className="rounded-lg border border-slate-300 bg-slate-50">
      <div className="grid gap-1 border-b border-slate-300 px-3 py-2 sm:grid-cols-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Total Income
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Total Expenses
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Remaining Balance
        </p>
      </div>

      <div className="grid gap-1 px-3 py-2 text-sm font-semibold tabular-nums sm:grid-cols-3">
        <p className="text-slate-900">{formatCurrency(totalIncome)}</p>
        <p className="text-slate-900">{formatCurrency(totalExpenses)}</p>
        <p className={remainingBalance >= 0 ? "text-emerald-700" : "text-rose-700"}>
          {formatCurrency(remainingBalance)}
        </p>
      </div>
    </section>
  );
}
