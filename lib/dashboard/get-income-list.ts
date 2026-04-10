import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";

export type IncomeListItem = {
  id: string;
  transactionDate: string;
  description: string;
  amount: number;
  categoryName: string | null;
};

type TransactionRow = {
  id: string;
  transaction_date: string;
  description: string | null;
  amount: number | string | null;
  category_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string | null;
};

export async function getIncomeList(
  monthStartIso: string,
  nextMonthStartIso: string
): Promise<IncomeListItem[]> {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { data: transactionsData, error: transactionsError } = await supabase
    .from("transactions")
    .select("id, transaction_date, description, amount, category_id, created_at")
    .eq("tenant_id", membership.tenant_id)
    .eq("transaction_type", "income")
    .gte("transaction_date", monthStartIso)
    .lt("transaction_date", nextMonthStartIso)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (transactionsError) {
    throw new Error(`Failed to load income list: ${transactionsError.message}`);
  }

  const transactions = (transactionsData ?? []) as TransactionRow[];

  const categoryIds = Array.from(
    new Set(
      transactions
        .map((transaction) => transaction.category_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const categoryNameById = new Map<string, string | null>();

  if (categoryIds.length) {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("tenant_id", membership.tenant_id)
      .in("id", categoryIds);

    if (categoriesError) {
      throw new Error(`Failed to load income categories: ${categoriesError.message}`);
    }

    for (const category of (categoriesData ?? []) as CategoryRow[]) {
      categoryNameById.set(category.id, category.name);
    }
  }

  return transactions.map((transaction) => ({
    id: String(transaction.id),
    transactionDate: String(transaction.transaction_date),
    description: String(transaction.description ?? ""),
    amount: Math.abs(Number(transaction.amount ?? 0)),
    categoryName: transaction.category_id
      ? (categoryNameById.get(transaction.category_id) ?? null)
      : null,
  }));
}
