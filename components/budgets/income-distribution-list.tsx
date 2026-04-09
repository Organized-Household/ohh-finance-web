import type { BudgetMetrics } from "@/components/budgets/budget-metrics";

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
      {metrics.incomeDistribution.map((item) => (
        <div key={item.categoryId} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="max-w-[10rem] truncate font-medium text-emerald-700">
              {item.name}
            </span>
            <span className="tabular-nums text-slate-600">
              {formatPercent(item.percentage)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
