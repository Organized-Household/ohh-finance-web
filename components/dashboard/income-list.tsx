import type { IncomeListItem } from "@/lib/dashboard/get-income-list";

type IncomeListProps = {
  items: IncomeListItem[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function IncomeList({ items }: IncomeListProps) {
  return (
    <section className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <div className="border-b border-slate-300 bg-slate-50 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Income Transactions
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="px-3 py-3 text-sm text-slate-600">
          No income transactions for this month.
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                Category
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2 text-sm text-slate-700">
                  {item.transactionDate}
                </td>
                <td className="px-3 py-2 text-sm text-slate-900">
                  {item.description || "-"}
                </td>
                <td className="px-3 py-2 text-sm text-slate-700">
                  {item.categoryName ?? "-"}
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-emerald-700">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
