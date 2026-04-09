import type { BudgetMetrics } from "@/components/budgets/budget-metrics";
import { getIncomeColor } from "@/components/budgets/income-colors";

type IncomeDistributionListProps = {
  metrics: BudgetMetrics;
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function IncomeDistributionList({
  metrics,
}: IncomeDistributionListProps) {
  if (metrics.incomeDistribution.length === 0) {
    return <p className="text-xs text-slate-500">No income categories yet.</p>;
  }

  return (
    <div className="space-y-2">
      {metrics.incomeDistribution.map((item, index) => (
        <div key={item.categoryId} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span
              className="max-w-[10rem] truncate font-medium"
              style={{ color: getIncomeColor(index) }}
            >
              {item.name}
            </span>
            <span className="tabular-nums text-slate-600">
              {formatPercent(item.percentage)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: getIncomeColor(index),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
