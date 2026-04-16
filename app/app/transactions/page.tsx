import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import WorkspaceShell from "@/components/layout/workspace-shell";
import HouseholdMemberCard from "@/components/layout/household-member-card";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import TransactionForm from "@/components/transactions/transaction-form";
import TransactionTable from "@/components/transactions/transaction-table";
import TransactionMonthSelector from "@/components/transactions/transaction-month-selector";
import { getUserFirstName } from "@/lib/auth/get-user-first-name";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "./actions";

type SearchParams = Promise<{
  month?: string;
}>;

type Category = {
  id: string;
  name: string;
  tag: "standard" | "savings" | "investment" | "debt_payment";
  category_type: "income" | "expense";
};

type Transaction = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "income" | "expense";
  category_id: string;
  savings_account_id: string | null;
  investment_account_id: string | null;
  debt_account_id: string | null;
  payment_savings_account_id: string | null;
  payment_investment_account_id: string | null;
  payment_debt_account_id: string | null;
};

type SavingsAccountOption = {
  id: string;
  purpose: string;
};

type InvestmentAccountOption = {
  id: string;
  name: string;
  account_type: string;
};

type DebtAccountOption = {
  id: string;
  name: string;
  type: string;
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const memberFirstName = getUserFirstName(user);
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

  const { data: savingsAccountsData, error: savingsAccountsError } = await supabase
    .from("savings_accounts")
    .select("id, purpose")
    .eq("tenant_id", membership.tenant_id)
    .order("purpose", { ascending: true });

  if (savingsAccountsError) {
    throw new Error(`Failed to load savings accounts: ${savingsAccountsError.message}`);
  }

  const { data: investmentAccountsData, error: investmentAccountsError } =
    await supabase
      .from("investment_accounts")
      .select("id, name, account_type")
      .eq("tenant_id", membership.tenant_id)
      .order("name", { ascending: true })
      .order("account_type", { ascending: true });

  if (investmentAccountsError) {
    throw new Error(
      `Failed to load investment accounts: ${investmentAccountsError.message}`
    );
  }

  const { data: debtAccountsData, error: debtAccountsError } = await supabase
    .from("debt_accounts")
    .select("id, name, type")
    .eq("tenant_id", membership.tenant_id)
    .order("name", { ascending: true })
    .order("type", { ascending: true });

  if (debtAccountsError) {
    throw new Error(`Failed to load debt accounts: ${debtAccountsError.message}`);
  }

  const savingsAccounts = (savingsAccountsData ?? []) as SavingsAccountOption[];
  const investmentAccounts = (investmentAccountsData ?? []) as InvestmentAccountOption[];
  const debtAccounts = (debtAccountsData ?? []) as DebtAccountOption[];

  const { data: transactionsData, error: transactionsError } = await supabase
    .from("transactions")
    .select(
      "id, transaction_date, description, amount, transaction_type, category_id, savings_account_id, investment_account_id, debt_account_id, payment_savings_account_id, payment_investment_account_id, payment_debt_account_id"
    )
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
    savings_account_id:
      typeof row.savings_account_id === "string" ? row.savings_account_id : null,
    investment_account_id:
      typeof row.investment_account_id === "string"
        ? row.investment_account_id
        : null,
    debt_account_id:
      typeof row.debt_account_id === "string" ? row.debt_account_id : null,
    payment_savings_account_id:
      typeof row.payment_savings_account_id === "string"
        ? row.payment_savings_account_id
        : null,
    payment_investment_account_id:
      typeof row.payment_investment_account_id === "string"
        ? row.payment_investment_account_id
        : null,
    payment_debt_account_id:
      typeof row.payment_debt_account_id === "string"
        ? row.payment_debt_account_id
        : null,
  }));

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const savingsAccountMap = new Map(
    savingsAccounts.map((account) => [account.id, account.purpose])
  );
  const investmentAccountMap = new Map(
    investmentAccounts.map((account) => [
      account.id,
      `${account.name} - ${account.account_type}`,
    ])
  );
  const debtAccountMap = new Map(
    debtAccounts.map((account) => [account.id, `${account.name} - ${account.type}`])
  );

  const tableRows = transactions.map((transaction) => {
    const category = categoryMap.get(transaction.category_id);
    const linkedAccountLabel = transaction.savings_account_id
      ? savingsAccountMap.get(transaction.savings_account_id) ?? null
      : transaction.investment_account_id
        ? investmentAccountMap.get(transaction.investment_account_id) ?? null
        : transaction.debt_account_id
          ? debtAccountMap.get(transaction.debt_account_id) ?? null
          : null;
    const paymentSourceLabel = transaction.payment_savings_account_id
      ? savingsAccountMap.get(transaction.payment_savings_account_id) ?? null
      : transaction.payment_investment_account_id
        ? investmentAccountMap.get(transaction.payment_investment_account_id) ?? null
        : transaction.payment_debt_account_id
          ? debtAccountMap.get(transaction.payment_debt_account_id) ?? null
          : null;

    return {
      id: transaction.id,
      transaction_date: transaction.transaction_date,
      description: transaction.description,
      amount: transaction.amount,
      transaction_type: transaction.transaction_type,
      category_id: transaction.category_id,
      category_name: category?.name ?? "Unknown category",
      category_tag: (category?.tag ?? "standard") as
        | "standard"
        | "savings"
        | "investment"
        | "debt_payment",
      savings_account_id: transaction.savings_account_id,
      investment_account_id: transaction.investment_account_id,
      debt_account_id: transaction.debt_account_id,
      linked_account_label: linkedAccountLabel,
      payment_savings_account_id: transaction.payment_savings_account_id,
      payment_investment_account_id: transaction.payment_investment_account_id,
      payment_debt_account_id: transaction.payment_debt_account_id,
      payment_source_label: paymentSourceLabel,
    };
  });

  const transactionCount = tableRows.length;
  const monthIncome = tableRows
    .filter((row) => row.transaction_type === "income")
    .reduce((sum, row) => sum + row.amount, 0);
  const monthExpense = tableRows
    .filter((row) => row.transaction_type === "expense")
    .reduce((sum, row) => sum + row.amount, 0);
  const standardExpense = tableRows
    .filter(
      (row) => row.transaction_type === "expense" && row.category_tag === "standard"
    )
    .reduce((sum, row) => sum + row.amount, 0);
  const savingsExpense = tableRows
    .filter(
      (row) => row.transaction_type === "expense" && row.category_tag === "savings"
    )
    .reduce((sum, row) => sum + row.amount, 0);
  const investmentExpense = tableRows
    .filter(
      (row) =>
        row.transaction_type === "expense" && row.category_tag === "investment"
    )
    .reduce((sum, row) => sum + row.amount, 0);
  const debtPaymentExpense = tableRows
    .filter(
      (row) =>
        row.transaction_type === "expense" && row.category_tag === "debt_payment"
    )
    .reduce((sum, row) => sum + row.amount, 0);

  const maxValue = Math.max(monthIncome, monthExpense, 1);
  const incomeBarHeight = (monthIncome / maxValue) * 100;
  const standardBarHeight = (standardExpense / maxValue) * 100;
  const savingsBarHeight = (savingsExpense / maxValue) * 100;
  const investmentBarHeight = (investmentExpense / maxValue) * 100;
  const debtPaymentBarHeight = (debtPaymentExpense / maxValue) * 100;

  const leftPanelSections: WorkspaceLeftPanelSection[] = [
    {
      title: "Household Member",
      content: <HouseholdMemberCard firstName={memberFirstName} />,
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
              {formatCurrency(monthIncome)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Expense</span>
            <span className="font-semibold tabular-nums text-rose-700">
              {formatCurrency(monthExpense)}
            </span>
          </div>
          <div className="space-y-1 border-t border-slate-200 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Standard</span>
              <span className="font-medium tabular-nums text-slate-700">
                {formatCurrency(standardExpense)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-teal-700">Savings</span>
              <span className="font-medium tabular-nums text-teal-700">
                {formatCurrency(savingsExpense)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-indigo-700">Investment</span>
              <span className="font-medium tabular-nums text-indigo-700">
                {formatCurrency(investmentExpense)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rose-700">Debt Payment</span>
              <span className="font-medium tabular-nums text-rose-700">
                {formatCurrency(debtPaymentExpense)}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Income vs Expense",
      content: (
        <div className="space-y-2">
          <div className="flex h-28 items-end justify-center gap-8 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex w-12 flex-col items-center gap-1">
              <div className="flex h-20 w-7 items-end overflow-hidden rounded-t bg-slate-200">
                <div
                  className="w-full bg-emerald-500"
                  style={{ height: `${incomeBarHeight}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-700">Income</span>
            </div>
            <div className="flex w-12 flex-col items-center gap-1">
              <div className="flex h-20 w-7 flex-col-reverse overflow-hidden rounded-t bg-slate-200">
                <div
                  className="bg-indigo-500"
                  style={{ height: `${investmentBarHeight}%` }}
                />
                <div
                  className="bg-rose-500"
                  style={{ height: `${debtPaymentBarHeight}%` }}
                />
                <div
                  className="bg-teal-500"
                  style={{ height: `${savingsBarHeight}%` }}
                />
                <div
                  className="bg-slate-500"
                  style={{ height: `${standardBarHeight}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-700">Expense</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-emerald-500" />
              <span>Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-slate-500" />
              <span>Standard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-teal-500" />
              <span>Savings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-indigo-500" />
              <span>Investment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-rose-500" />
              <span>Debt Payment</span>
            </div>
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
      savings_account_id: String(formData.get("savings_account_id") ?? ""),
      investment_account_id: String(formData.get("investment_account_id") ?? ""),
      debt_account_id: String(formData.get("debt_account_id") ?? ""),
      payment_savings_account_id: String(
        formData.get("payment_savings_account_id") ?? ""
      ),
      payment_investment_account_id: String(
        formData.get("payment_investment_account_id") ?? ""
      ),
      payment_debt_account_id: String(formData.get("payment_debt_account_id") ?? ""),
    });
  };

  const updateAction = async (formData: FormData) => {
    "use server";

    await updateTransaction({
      id: String(formData.get("id") ?? ""),
      month: String(formData.get("month") ?? ""),
      description: String(formData.get("description") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      transaction_date: String(formData.get("transaction_date") ?? ""),
      category_id: String(formData.get("category_id") ?? ""),
      savings_account_id: String(formData.get("savings_account_id") ?? ""),
      investment_account_id: String(formData.get("investment_account_id") ?? ""),
      debt_account_id: String(formData.get("debt_account_id") ?? ""),
      payment_savings_account_id: String(
        formData.get("payment_savings_account_id") ?? ""
      ),
      payment_investment_account_id: String(
        formData.get("payment_investment_account_id") ?? ""
      ),
      payment_debt_account_id: String(formData.get("payment_debt_account_id") ?? ""),
    });
  };

  const deleteAction = async (formData: FormData) => {
    "use server";

    await deleteTransaction({
      id: String(formData.get("id") ?? ""),
      month: String(formData.get("month") ?? ""),
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
            savingsAccounts={savingsAccounts}
            investmentAccounts={investmentAccounts}
            debtAccounts={debtAccounts}
            action={createAction}
          />
        ) : (
          <section className="rounded-lg border border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
            No categories found for this tenant. Create categories first before
            adding transactions.
          </section>
        )}

        <TransactionTable
          rows={tableRows}
          categories={categories}
          savingsAccounts={savingsAccounts}
          investmentAccounts={investmentAccounts}
          debtAccounts={debtAccounts}
          selectedMonth={selectedMonth}
          updateAction={updateAction}
          deleteAction={deleteAction}
        />
      </div>
    </WorkspaceShell>
  );
}
