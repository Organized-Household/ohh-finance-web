import type { CreditCardExpensesByAccount } from "@/lib/dashboard/get-credit-card-expenses-by-account";

type CreditCardExpensesByAccountProps = {
  data: CreditCardExpensesByAccount;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CreditCardExpensesByAccountSection({
  data,
}: CreditCardExpensesByAccountProps) {
  return (
    <section className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <div className="border-b border-slate-300 bg-slate-50 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Credit Card Expenses
        </h2>
      </div>

      {data.rows.length === 0 ? (
        <div className="px-3 py-3 text-sm text-slate-600">
          No credit card expenses for this month.
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                Credit Card Account
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.rows.map((row) => (
              <tr key={row.accountId}>
                <td className="px-3 py-2 text-sm text-slate-900">{row.accountName}</td>
                <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-rose-700">
                  {formatCurrency(row.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                Total
              </td>
              <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-slate-900">
                {formatCurrency(data.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}
