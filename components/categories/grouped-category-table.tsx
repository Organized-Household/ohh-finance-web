import CategorySectionTable, { type ExpenseTypeOption } from "@/components/categories/category-section-table";

type Category = {
  id: string;
  name: string;
  tag: string;
  category_type: "income" | "expense";
};

type GroupedCategoryTableProps = {
  categories: Category[];
  expenseTypes: ExpenseTypeOption[];
};

export default function GroupedCategoryTable({
  categories,
  expenseTypes,
}: GroupedCategoryTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col />
          <col className="w-40" />
          <col className="w-36" />
          <col className="w-44" />
        </colgroup>
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
              Name
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
              Category Type
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
              Tag
            </th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
      </table>

      {/* Income section — always first */}
      <CategorySectionTable
        key="income"
        title="Income"
        rows={categories.filter((c) => c.category_type === "income")}
        expenseTypes={expenseTypes}
      />

      {/* One section per expense type, ordered by sort_order */}
      {expenseTypes.map((et) => (
        <CategorySectionTable
          key={et.slug}
          title={et.name}
          rows={categories.filter(
            (c) => c.category_type === "expense" && c.tag === et.slug
          )}
          expenseTypes={expenseTypes}
        />
      ))}
    </section>
  );
}
