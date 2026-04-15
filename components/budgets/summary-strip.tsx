import type { BudgetMetrics } from "@/components/budgets/budget-metrics";

type SummaryStripProps = {
  metrics: BudgetMetrics;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const items = [
  {
    key: "income",
    label: "Income",
    accentClass: "text-emerald-700",
    bgClass: "bg-emerald-50",
  },
  {
    key: "standard",
    label: "Standard",
    accentClass: "text-slate-700",
    bgClass: "bg-slate-100",
  },
  {
    key: "savings",
    label: "Savings",
    accentClass: "text-teal-700",
    bgClass: "bg-teal-50",
  },
  {
    key: "investment",
    label: "Investment",
    accentClass: "text-indigo-700",
    bgClass: "bg-indigo-50",
  },
  {
    key: "debt_payment",
    label: "Debt Payment",
    accentClass: "text-rose-700",
    bgClass: "bg-rose-50",
  },
] as const;

export default function SummaryStrip({ metrics }: SummaryStripProps) {
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-3">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-md border border-slate-200 px-3 py-2 ${item.bgClass}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {item.label}
            </p>
            <p className={`mt-1 text-lg font-semibold ${item.accentClass}`}>
              {formatCurrency(metrics.totals[item.key])}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
