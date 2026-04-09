type SectionRow = {
  id: string;
  name: string;
  amount: string;
};

type BudgetSectionTableProps = {
  sectionKey: string;
  title: string;
  rows: SectionRow[];
  subtotal: number;
  onAmountChange: (categoryId: string, value: string) => void;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function BudgetSectionTable({
  sectionKey,
  title,
  rows,
  subtotal,
  onAmountChange,
}: BudgetSectionTableProps) {
  return (
    <tbody>
      <tr className="bg-slate-100">
        <th
          colSpan={2}
          scope="rowgroup"
          className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700"
        >
          {title}
        </th>
      </tr>

      {rows.length === 0 ? (
        <tr className="border-b border-slate-200">
          <td colSpan={2} className="px-3 py-2 text-xs text-slate-500">
            No categories in this group.
          </td>
        </tr>
      ) : (
        rows.map((row) => (
          <tr key={row.id} className="border-b border-slate-200">
            <td className="px-3 py-1.5 text-sm text-slate-800">{row.name}</td>
            <td className="w-48 px-3 py-1.5">
              <input
                id={`amount-${sectionKey}-${row.id}`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={row.amount}
                onChange={(event) => onAmountChange(row.id, event.target.value)}
                className="h-8 w-full rounded border border-slate-300 px-2 text-right text-sm tabular-nums"
                aria-label={`Planned amount for ${row.name}`}
              />
            </td>
          </tr>
        ))
      )}

      <tr className="border-b border-slate-300 bg-slate-50">
        <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {title} subtotal
        </td>
        <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-slate-900">
          {formatCurrency(subtotal)}
        </td>
      </tr>
    </tbody>
  );
}
