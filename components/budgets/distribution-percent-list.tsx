import type {
  BudgetBucketKey,
  BudgetMetrics,
} from "@/components/budgets/budget-metrics";

type DistributionPercentListProps = {
  metrics: BudgetMetrics;
};

const items: Array<{
  key: BudgetBucketKey;
  label: string;
  accentClass: string;
  barClass: string;
}> = [
  {
    key: "income",
    label: "Income",
    accentClass: "text-emerald-700",
    barClass: "bg-emerald-500",
  },
  {
    key: "standard",
    label: "Standard",
    accentClass: "text-slate-700",
    barClass: "bg-slate-500",
  },
  {
    key: "savings",
    label: "Savings",
    accentClass: "text-teal-700",
    barClass: "bg-teal-500",
  },
  {
    key: "investment",
    label: "Investment",
    accentClass: "text-indigo-700",
    barClass: "bg-indigo-500",
  },
];

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function DistributionPercentList({
  metrics,
}: DistributionPercentListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const percent = metrics.percentages[item.key];

        return (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium ${item.accentClass}`}>
                {item.label}
              </span>
              <span className="tabular-nums text-slate-600">
                {formatPercent(percent)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${item.barClass}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
