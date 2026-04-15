import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";

export type BudgetVsActualRow = {
  categoryId: string;
  categoryName: string;
  categoryType: "income" | "expense";
  tag: "standard" | "savings" | "investment" | "debt_payment";
  budgetedAmount: number;
  actualAmount: number;
  varianceAmount: number;
};

export type BudgetVsActualTableData = {
  rows: BudgetVsActualRow[];
  totals: {
    budgetedAmount: number;
    actualAmount: number;
    varianceAmount: number;
  };
};

type CategoryRow = {
  id: string;
  name: string;
  category_type: "income" | "expense";
  tag: "standard" | "savings" | "investment" | "debt_payment";
};

type BudgetRow = {
  id: string;
};

type BudgetLineRow = {
  category_id: string;
  amount: number | string | null;
};

type TransactionRow = {
  category_id: string | null;
  amount: number | string | null;
};

export async function getBudgetVsActual(
  monthStartIso: string,
  nextMonthStartIso: string
): Promise<BudgetVsActualTableData> {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, category_type, tag")
    .eq("tenant_id", membership.tenant_id)
    .order("category_type", { ascending: true })
    .order("tag", { ascending: true })
    .order("name", { ascending: true });

  if (categoriesError) {
    throw new Error(`Failed to load budget categories: ${categoriesError.message}`);
  }

  const categories = (categoriesData ?? []) as CategoryRow[];

  const { data: budgetData, error: budgetError } = await supabase
    .from("budgets")
    .select("id")
    .eq("tenant_id", membership.tenant_id)
    .eq("user_id", user.id)
    .eq("month_start", monthStartIso)
    .maybeSingle();

  if (budgetError) {
    throw new Error(`Failed to load selected month budget: ${budgetError.message}`);
  }

  const budget = budgetData as BudgetRow | null;
  const budgetAmountByCategoryId = new Map<string, number>();

  if (budget?.id) {
    const { data: budgetLinesData, error: budgetLinesError } = await supabase
      .from("budget_lines")
      .select("category_id, amount")
      .eq("tenant_id", membership.tenant_id)
      .eq("budget_id", budget.id);

    if (budgetLinesError) {
      throw new Error(`Failed to load budget lines: ${budgetLinesError.message}`);
    }

    for (const row of (budgetLinesData ?? []) as BudgetLineRow[]) {
      const amount = Number(row.amount ?? 0);
      budgetAmountByCategoryId.set(
        row.category_id,
        Number.isFinite(amount) ? Math.abs(amount) : 0
      );
    }
  }

  const { data: transactionsData, error: transactionsError } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("tenant_id", membership.tenant_id)
    .gte("transaction_date", monthStartIso)
    .lt("transaction_date", nextMonthStartIso);

  if (transactionsError) {
    throw new Error(`Failed to load actual transactions: ${transactionsError.message}`);
  }

  const actualAmountByCategoryId = new Map<string, number>();
  for (const row of (transactionsData ?? []) as TransactionRow[]) {
    if (!row.category_id) {
      continue;
    }

    const amount = Number(row.amount ?? 0);
    if (!Number.isFinite(amount)) {
      continue;
    }

    const existing = actualAmountByCategoryId.get(row.category_id) ?? 0;
    actualAmountByCategoryId.set(row.category_id, existing + Math.abs(amount));
  }

  const rows: BudgetVsActualRow[] = categories.map((category) => {
    const budgetedAmount = budgetAmountByCategoryId.get(category.id) ?? 0;
    const actualAmount = actualAmountByCategoryId.get(category.id) ?? 0;
    const varianceAmount = budgetedAmount - actualAmount;

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryType: category.category_type,
      tag: category.tag,
      budgetedAmount,
      actualAmount,
      varianceAmount,
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.budgetedAmount += row.budgetedAmount;
      acc.actualAmount += row.actualAmount;
      acc.varianceAmount += row.varianceAmount;
      return acc;
    },
    {
      budgetedAmount: 0,
      actualAmount: 0,
      varianceAmount: 0,
    }
  );

  return { rows, totals };
}
