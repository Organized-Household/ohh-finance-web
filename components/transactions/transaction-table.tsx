type TransactionRow = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "income" | "expense";
  category_name: string;
  category_tag: "standard" | "savings" | "investment";
};

type TransactionTableProps = {
  rows: TransactionRow[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function TransactionTable({ rows }: TransactionTableProps) {
  if (!rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
        No transactions for this month yet.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
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
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Tag
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
              Amount
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Type
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 text-sm text-slate-700">
                {row.transaction_date}
              </td>
              <td className="px-3 py-2 text-sm text-slate-900">
                {row.description}
              </td>
              <td className="px-3 py-2 text-sm text-slate-700">
                {row.category_name}
              </td>
              <td className="px-3 py-2 text-sm capitalize text-slate-700">
                {row.category_tag}
              </td>
              <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-slate-900">
                {formatCurrency(row.amount)}
              </td>
              <td className="px-3 py-2 text-sm capitalize text-slate-700">
                {row.transaction_type}
              </td>
              <td className="px-3 py-2 text-sm text-slate-500">Coming soon</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
