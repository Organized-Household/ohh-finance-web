import CategorySectionTable from "@/components/categories/category-section-table";

type Category = {
  id: string;
  name: string;
  tag: "standard" | "savings" | "investment";
  category_type: "income" | "expense";
};

type GroupedCategoryTableProps = {
  categories: Category[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

const tagOrder: Array<{
  key: "standard" | "savings" | "investment";
  label: string;
}> = [
  { key: "standard", label: "Standard" },
  { key: "savings", label: "Savings" },
  { key: "investment", label: "Investment" },
];

export default function GroupedCategoryTable({
  categories,
  updateAction,
  deleteAction,
}: GroupedCategoryTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      <div className="grid items-center gap-2 border-b border-slate-300 bg-slate-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white md:grid-cols-[minmax(0,1fr)_10rem_9rem_auto]">
        <span>Name</span>
        <span>Category Type</span>
        <span>Tag</span>
        <span className="text-right">Actions</span>
      </div>

      {tagOrder.map((tag) => (
        <CategorySectionTable
          key={tag.key}
          title={tag.label}
          rows={categories.filter((category) => category.tag === tag.key)}
          updateAction={updateAction}
          deleteAction={deleteAction}
        />
      ))}
    </section>
  );
}
