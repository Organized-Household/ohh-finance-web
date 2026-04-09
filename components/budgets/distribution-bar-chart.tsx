import type { BudgetMetrics } from "@/components/budgets/budget-metrics";

type DistributionBarChartProps = {
  metrics: BudgetMetrics;
};

const colors = {
  income: "#10b981",
  standard: "#64748b",
  savings: "#14b8a6",
  investment: "#6366f1",
};

function percent(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0;
  }

  return (value / maxValue) * 100;
}

export default function DistributionBarChart({ metrics }: DistributionBarChartProps) {
  const incomeTotal = metrics.totals.income;
  const expenseTotal = metrics.totalExpenses;
  const maxValue = Math.max(incomeTotal, expenseTotal);

  const incomeHeight = percent(incomeTotal, maxValue);
  const standardHeight = percent(metrics.totals.standard, maxValue);
  const savingsHeight = percent(metrics.totals.savings, maxValue);
  const investmentHeight = percent(metrics.totals.investment, maxValue);

  return (
    <div className="space-y-3">
      <div className="flex h-32 items-end justify-center gap-8 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex w-14 flex-col items-center gap-1">
          <div className="relative flex h-24 w-8 items-end overflow-hidden rounded-t bg-slate-200">
            <div
              className="w-full"
              style={{
                height: `${incomeHeight}%`,
                backgroundColor: colors.income,
              }}
              aria-hidden="true"
            />
          </div>
          <span className="text-[11px] font-medium text-slate-700">Income</span>
        </div>

        <div className="flex w-14 flex-col items-center gap-1">
          <div className="relative flex h-24 w-8 flex-col-reverse overflow-hidden rounded-t bg-slate-200">
            <div
              style={{ height: `${investmentHeight}%`, backgroundColor: colors.investment }}
            />
            <div style={{ height: `${savingsHeight}%`, backgroundColor: colors.savings }} />
            <div style={{ height: `${standardHeight}%`, backgroundColor: colors.standard }} />
          </div>
          <span className="text-[11px] font-medium text-slate-700">Expenses</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: colors.income }}
          />
          <span>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: colors.standard }}
          />
          <span>Standard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: colors.savings }}
          />
          <span>Savings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: colors.investment }}
          />
          <span>Investment</span>
        </div>
      </div>
    </div>
  );
}
