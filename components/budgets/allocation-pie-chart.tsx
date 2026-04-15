import type {
  BudgetBucketKey,
  BudgetMetrics,
} from "@/components/budgets/budget-metrics";

type AllocationPieChartProps = {
  metrics: BudgetMetrics;
};

const items: Array<{ key: BudgetBucketKey; label: string; color: string }> = [
  {
    key: "income",
    label: "Income",
    color: "#10b981",
  },
  {
    key: "standard",
    label: "Standard",
    color: "#64748b",
  },
  {
    key: "savings",
    label: "Savings",
    color: "#14b8a6",
  },
  {
    key: "investment",
    label: "Investment",
    color: "#6366f1",
  },
  {
    key: "debt_payment",
    label: "Debt Payment",
    color: "#f43f5e",
  },
];

const RADIUS = 28;
const STROKE_WIDTH = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getStrokeOffset(progress: number): number {
  return CIRCUMFERENCE * (1 - progress);
}

export default function AllocationPieChart({ metrics }: AllocationPieChartProps) {
  if (metrics.distributionTotal === 0) {
    return (
      <div className="space-y-2">
        <div className="mx-auto w-fit">
          <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
            <circle
              cx="42"
              cy="42"
              r={RADIUS}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={STROKE_WIDTH}
            />
          </svg>
        </div>
        <p className="text-center text-xs text-slate-500">
          No allocations yet for this month.
        </p>
      </div>
    );
  }

  const segments = items
    .map((item, index) => {
      const ratio = metrics.totals[item.key] / metrics.distributionTotal;
      const segmentLength = ratio * CIRCUMFERENCE;
      const previousRatio = items
        .slice(0, index)
        .reduce(
          (sum, previousItem) =>
            sum + metrics.totals[previousItem.key] / metrics.distributionTotal,
          0
        );

      return {
        key: item.key,
        color: item.color,
        segmentLength,
        dashOffset: getStrokeOffset(previousRatio),
      };
    })
    .filter((segment) => segment.segmentLength > 0);

  return (
    <div className="space-y-2">
      <div className="mx-auto w-fit">
        <svg
          width="84"
          height="84"
          viewBox="0 0 84 84"
          role="img"
          aria-label="Budget distribution pie chart"
        >
          <g transform="rotate(-90 42 42)">
            <circle
              cx="42"
              cy="42"
              r={RADIUS}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={STROKE_WIDTH}
            />
            {segments.map((segment) => {
              return (
                <circle
                  key={segment.key}
                  cx="42"
                  cy="42"
                  r={RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${segment.segmentLength} ${CIRCUMFERENCE}`}
                  strokeDashoffset={segment.dashOffset}
                />
              );
            })}
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
