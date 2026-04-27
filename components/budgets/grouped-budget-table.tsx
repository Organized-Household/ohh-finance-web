import BudgetSectionTable from "@/components/budgets/budget-section-table";

export type GroupedBudgetSection = {
  key: string;
  title: string;
  rows: Array<{
    id: string;
    name: string;
    amount: string;
  }>;
  subtotal: number;
};

type GroupedBudgetTableProps = {
  sections: GroupedBudgetSection[];
  onAmountChange: (categoryId: string, value: string) => void;
  inputsDisabled?: boolean;
};

export default function GroupedBudgetTable({
  sections,
  onAmountChange,
  inputsDisabled = false,
}: GroupedBudgetTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300">
      <table className="w-full border-collapse bg-white">
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Category
            </th>
            <th className="w-48 px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
              Amount
            </th>
          </tr>
        </thead>

        {sections.map((section) => (
          <BudgetSectionTable
            key={section.key}
            sectionKey={section.key}
            title={section.title}
            rows={section.rows}
            subtotal={section.subtotal}
            onAmountChange={onAmountChange}
            inputsDisabled={inputsDisabled}
          />
        ))}
      </table>
    </div>
  );
}
