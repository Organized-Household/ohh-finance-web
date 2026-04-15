import type { BudgetMetrics } from "@/components/budgets/budget-metrics";
import { getIncomeColor } from "@/components/budgets/income-colors";

type DistributionBarChartProps = {
  metrics: BudgetMetrics;
};

const colors = {
  standard: "#64748b",
  savings: "#14b8a6",
  investment: "#6366f1",
  debt_payment: "#f43f5e",
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

  const standardHeight = percent(metrics.totals.standard, maxValue);
  const savingsHeight = percent(metrics.totals.savings, maxValue);
  const investmentHeight = percent(metrics.totals.investment, maxValue);
  const debtPaymentHeight = percent(metrics.totals.debt_payment, maxValue);

  return (
    <div className="space-y-3">
      <div className="flex h-32 items-end justify-center gap-8 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex w-14 flex-col items-center gap-1">
          <div className="relative flex h-24 w-8 flex-col-reverse overflow-hidden rounded-t bg-slate-200">
            {metrics.incomeDistribution.map((incomeSlice, index) => (
              <div
                key={incomeSlice.categoryId}
                style={{
                  height: `${percent(incomeSlice.amount, maxValue)}%`,
                  backgroundColor: getIncomeColor(index),
                }}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-slate-700">Income</span>
        </div>

        <div className="flex w-14 flex-col items-center gap-1">
          <div className="relative flex h-24 w-8 flex-col-reverse overflow-hidden rounded-t bg-slate-200">
            <div
              style={{ height: `${investmentHeight}%`, backgroundColor: colors.investment }}
            />
            <div
              style={{ height: `${debtPaymentHeight}%`, backgroundColor: colors.debt_payment }}
            />
            <div style={{ height: `${savingsHeight}%`, backgroundColor: colors.savings }} />
            <div style={{ height: `${standardHeight}%`, backgroundColor: colors.standard }} />
          </div>
          <span className="text-[11px] font-medium text-slate-700">Expenses</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
        {metrics.incomeDistribution.length ? (
          metrics.incomeDistribution.map((incomeSlice, index) => (
            <div key={incomeSlice.categoryId} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: getIncomeColor(index) }}
              />
              <span className="truncate">{incomeSlice.name}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: getIncomeColor(0) }}
            />
            <span>Income</span>
          </div>
        )}
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
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: colors.debt_payment }}
          />
          <span>Debt Payment</span>
        </div>
      </div>
    </div>
  );
}
