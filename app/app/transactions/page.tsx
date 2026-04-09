import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import TransactionForm from "@/components/transactions/transaction-form";
import TransactionTable from "@/components/transactions/transaction-table";
import TransactionMonthSelector from "@/components/transactions/transaction-month-selector";
import { createTransaction } from "./actions";

type SearchParams = Promise<{
  month?: string;
}>;

type Category = {
  id: string;
  name: string;
  tag: "standard" | "savings" | "investment";
  category_type: "income" | "expense";
};

type Transaction = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "income" | "expense";
  category_id: string;
};

function getMonthRange(month: string) {
  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function toMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function isValidMonth(month: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(month);

  if (!match) {
    return false;
  }

  const monthNumber = Number(match[2]);
  return monthNumber >= 1 && monthNumber <= 12;
}

function getMonthOptions(selectedMonth: string): string[] {
  const [yearString, monthString] = selectedMonth.split("-");
  const baseYear = Number(yearString);
  const baseMonthIndex = Number(monthString) - 1;
  const options: string[] = [];

  for (let offset = -5; offset <= 5; offset += 1) {
    const date = new Date(baseYear, baseMonthIndex + offset, 1);
    options.push(toMonthString(date));
  }

  return options;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const currentMonth = toMonthString(new Date());
  const selectedMonth =
    params.month && isValidMonth(params.month)
      ? params.month
      : currentMonth;

  const monthRange = getMonthRange(selectedMonth);

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, tag, category_type")
    .eq("tenant_id", membership.tenant_id)
    .order("category_type", { ascending: true })
    .order("tag", { ascending: true })
    .order("name", { ascending: true });

  if (categoriesError) {
    throw new Error(`Failed to load categories: ${categoriesError.message}`);
  }

  const categories: Category[] = (categoriesData ?? []) as Category[];

  const { data: transactionsData, error: transactionsError } = await supabase
    .from("transactions")
    .select("id, transaction_date, description, amount, transaction_type, category_id")
    .eq("tenant_id", membership.tenant_id)
    .gte("transaction_date", monthRange.start)
    .lt("transaction_date", monthRange.end)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (transactionsError) {
    throw new Error(`Failed to load transactions: ${transactionsError.message}`);
  }

  const transactions: Transaction[] = (transactionsData ?? []).map((row) => ({
    id: String(row.id),
    transaction_date: String(row.transaction_date),
    description: String(row.description),
    amount: Number(row.amount ?? 0),
    transaction_type: row.transaction_type as "income" | "expense",
    category_id: String(row.category_id),
  }));

  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const tableRows = transactions.map((transaction) => {
    const category = categoryMap.get(transaction.category_id);

    return {
      id: transaction.id,
      transaction_date: transaction.transaction_date,
      description: transaction.description,
      amount: transaction.amount,
      transaction_type: transaction.transaction_type,
      category_name: category?.name ?? "Unknown category",
      category_tag: (category?.tag ?? "standard") as
        | "standard"
        | "savings"
        | "investment",
    };
  });

  const transactionCount = tableRows.length;
  const monthIncome = tableRows
    .filter((row) => row.transaction_type === "income")
    .reduce((sum, row) => sum + row.amount, 0);
  const monthExpense = tableRows
    .filter((row) => row.transaction_type === "expense")
    .reduce((sum, row) => sum + row.amount, 0);

  const leftPanelSections: WorkspaceLeftPanelSection[] = [
    {
      title: "Household Member",
      content: (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
          Member selector placeholder. Shared member switching logic will be
          added in a future phase.
        </div>
      ),
    },
    {
      title: "Month Overview",
      content: (
        <div className="space-y-2 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span>Transactions</span>
            <span className="font-semibold tabular-nums">{transactionCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Income</span>
            <span className="font-semibold tabular-nums text-emerald-700">
              {new Intl.NumberFormat("en-CA", {
                style: "currency",
                currency: "CAD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(monthIncome)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Expense</span>
            <span className="font-semibold tabular-nums text-rose-700">
              {new Intl.NumberFormat("en-CA", {
                style: "currency",
                currency: "CAD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(monthExpense)}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Data Scope",
      content: (
        <p className="text-xs text-slate-600">
          Transactions are tenant-scoped and tied to categories. Category type
          determines income or expense classification.
        </p>
      ),
    },
  ];

  const createAction = async (formData: FormData) => {
    "use server";

    await createTransaction({
      description: String(formData.get("description") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      transaction_date: String(formData.get("transaction_date") ?? ""),
      category_id: String(formData.get("category_id") ?? ""),
    });
  };

  return (
    <WorkspaceShell
      title="Transactions"
      description="Capture actual financial activity for reporting, summaries, and budget-vs-actual analysis."
      leftPanelSections={leftPanelSections}
      topbarControls={
        <TransactionMonthSelector
          selectedMonth={selectedMonth}
          options={getMonthOptions(selectedMonth)}
        />
      }
    >
      <div className="space-y-3">
        {categories.length ? (
          <TransactionForm
            categories={categories}
            defaultDate={monthRange.start}
            action={createAction}
          />
        ) : (
          <section className="rounded-lg border border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
            No categories found for this tenant. Create categories first before
            adding transactions.
          </section>
        )}

        <TransactionTable rows={tableRows} />
      </div>
    </WorkspaceShell>
  );
}
