import CategorySectionTable from "@/components/categories/category-section-table";

type Category = {
  id: string;
  name: string;
  tag: "standard" | "savings" | "investment";
  category_type: "income" | "expense";
};

type GroupedCategoryTableProps = {
  categories: Category[];
};

const sectionOrder: Array<{
  key: "income" | "standard" | "savings" | "investment";
  label: string;
}> = [
  { key: "income", label: "Income" },
  { key: "standard", label: "Standard" },
  { key: "savings", label: "Savings" },
  { key: "investment", label: "Investment" },
];

export default function GroupedCategoryTable({
  categories,
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

      {sectionOrder.map((section) => (
        <CategorySectionTable
          key={section.key}
          title={section.label}
          rows={categories.filter((category) => {
            if (section.key === "income") {
              return category.category_type === "income";
            }

            if (section.key === "standard") {
              return (
                category.category_type === "expense" &&
                category.tag === "standard"
              );
            }

            if (section.key === "savings") {
              return (
                category.category_type === "expense" &&
                category.tag === "savings"
              );
            }

            return (
              category.category_type === "expense" &&
              category.tag === "investment"
            );
          })}
        />
      ))}
    </section>
  );
}
