import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";

export type IncomeVsExpenseSummary = {
  incomeTotal: number;
  expenseTotal: number;
  difference: number;
};

type TransactionSummaryRow = {
  amount: number | string | null;
  transaction_type: "income" | "expense";
};

export async function getIncomeVsExpenseSummary(
  monthStartIso: string,
  nextMonthStartIso: string
): Promise<IncomeVsExpenseSummary> {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, transaction_type")
    .eq("tenant_id", membership.tenant_id)
    .gte("transaction_date", monthStartIso)
    .lt("transaction_date", nextMonthStartIso);

  if (error) {
    throw new Error(`Failed to load income vs expense summary: ${error.message}`);
  }

  const summary = (data ?? []).reduce(
    (acc, row) => {
      const typedRow = row as TransactionSummaryRow;
      const amount = Math.abs(Number(typedRow.amount ?? 0));

      if (!Number.isFinite(amount)) {
        return acc;
      }

      if (typedRow.transaction_type === "income") {
        acc.incomeTotal += amount;
      } else if (typedRow.transaction_type === "expense") {
        acc.expenseTotal += amount;
      }

      return acc;
    },
    {
      incomeTotal: 0,
      expenseTotal: 0,
      difference: 0,
    }
  );

  summary.difference = summary.incomeTotal - summary.expenseTotal;
  return summary;
}
