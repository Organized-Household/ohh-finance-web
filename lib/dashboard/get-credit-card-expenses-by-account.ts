import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";

export type CreditCardExpenseRow = {
  accountId: string;
  accountName: string;
  totalAmount: number;
};

export type CreditCardExpensesByAccount = {
  rows: CreditCardExpenseRow[];
  totalAmount: number;
};

type DebtAccountRow = {
  id: string;
  name: string | null;
  account_subtype: string | null;
};

type TransactionRow = {
  payment_source_account_id: string | null;
  amount: number | string | null;
};

function normalizeDebtType(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isCreditCardDebtType(typeValue: string | null): boolean {
  if (!typeValue) {
    return false;
  }

  const normalized = normalizeDebtType(typeValue);
  return normalized === "creditcard" || normalized === "creditcards";
}

export async function getCreditCardExpensesByAccount(
  monthStartIso: string,
  nextMonthStartIso: string
): Promise<CreditCardExpensesByAccount> {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { data: debtAccountsData, error: debtAccountsError } = await supabase
    .from("accounts")
    .select("id, name, account_subtype")
    .eq("tenant_id", membership.tenant_id)
    .eq("account_kind", "debt")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (debtAccountsError) {
    throw new Error(
      `Failed to load debt accounts for credit card grouping: ${debtAccountsError.message}`
    );
  }

  const creditCardAccounts = (debtAccountsData ?? [])
    .map((row) => row as DebtAccountRow)
    .filter((row) => isCreditCardDebtType(row.account_subtype));

  if (!creditCardAccounts.length) {
    return {
      rows: [],
      totalAmount: 0,
    };
  }

  const creditCardIds = creditCardAccounts.map((account) => account.id);
  const accountNameById = new Map(
    creditCardAccounts.map((account) => [
      account.id,
      (account.name ?? "Unnamed credit card").trim() || "Unnamed credit card",
    ])
  );

  const { data: transactionsData, error: transactionsError } = await supabase
    .from("transactions")
    .select("payment_source_account_id, amount")
    .eq("tenant_id", membership.tenant_id)
    .eq("transaction_type", "expense")
    .gte("transaction_date", monthStartIso)
    .lt("transaction_date", nextMonthStartIso)
    .in("payment_source_account_id", creditCardIds);

  if (transactionsError) {
    throw new Error(
      `Failed to load credit card expense transactions: ${transactionsError.message}`
    );
  }

  const totalsByAccount = new Map<string, number>();

  for (const row of (transactionsData ?? []) as TransactionRow[]) {
    if (!row.payment_source_account_id) {
      continue;
    }

    const amount = Number(row.amount ?? 0);
    if (!Number.isFinite(amount)) {
      continue;
    }

    const existingTotal = totalsByAccount.get(row.payment_source_account_id) ?? 0;
    totalsByAccount.set(row.payment_source_account_id, existingTotal + Math.abs(amount));
  }

  const rows: CreditCardExpenseRow[] = Array.from(totalsByAccount.entries())
    .map(([accountId, totalAmount]) => ({
      accountId,
      accountName: accountNameById.get(accountId) ?? "Unknown credit card",
      totalAmount,
    }))
    .sort((a, b) => a.accountName.localeCompare(b.accountName));

  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);

  return {
    rows,
    totalAmount,
  };
}
