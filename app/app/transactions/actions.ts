"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  deleteTransactionSchema,
  transactionSchema,
  updateTransactionSchema,
} from "@/lib/validation/transaction";

type CategoryTag = "standard" | "savings" | "investment" | "debt_payment";

type TransactionLinkInput = {
  savings_account_id: string | null;
  investment_account_id: string | null;
  debt_account_id: string | null;
};

type TransactionPaymentSourceInput = {
  payment_savings_account_id: string | null;
  payment_investment_account_id: string | null;
  payment_debt_account_id: string | null;
};

async function getTenantCategory({
  categoryId,
  tenantId,
}: {
  categoryId: string;
  tenantId: string;
}) {
  const supabase = await createClient();
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, category_type, tag")
    .eq("id", categoryId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (categoryError) {
    throw new Error(`Failed to load category: ${categoryError.message}`);
  }

  if (!category) {
    throw new Error("Category not found in current tenant");
  }

  return {
    categoryType: category.category_type as "income" | "expense",
    categoryTag: category.tag as CategoryTag,
  };
}

async function assertLinkedAccountBelongsToTenant({
  supabase,
  table,
  accountId,
  tenantId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  table: "savings_accounts" | "investment_accounts" | "debt_accounts";
  accountId: string | null;
  tenantId: string;
}) {
  if (!accountId) {
    return;
  }

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", accountId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to validate linked account: ${error.message}`);
  }

  if (!data) {
    throw new Error("Linked account not found in current tenant");
  }
}

function assertCategoryCompatibleLink({
  categoryType,
  categoryTag,
  destinationLinks,
  paymentSources,
}: {
  categoryType: "income" | "expense";
  categoryTag: CategoryTag;
  destinationLinks: TransactionLinkInput;
  paymentSources: TransactionPaymentSourceInput;
}) {
  const { savings_account_id, investment_account_id, debt_account_id } =
    destinationLinks;
  const {
    payment_savings_account_id,
    payment_investment_account_id,
    payment_debt_account_id,
  } = paymentSources;

  if (categoryType === "income") {
    if (
      savings_account_id ||
      investment_account_id ||
      debt_account_id ||
      payment_savings_account_id ||
      payment_investment_account_id ||
      payment_debt_account_id
    ) {
      throw new Error(
        "Income transactions cannot include linked destination or payment source accounts."
      );
    }
    return;
  }

  if (categoryTag === "standard") {
    if (savings_account_id || investment_account_id || debt_account_id) {
      throw new Error(
        "Standard expense categories cannot include linked destination accounts."
      );
    }
    return;
  }

  if (categoryTag === "savings") {
    if (investment_account_id || debt_account_id) {
      throw new Error(
        "Savings categories may only link to a savings account."
      );
    }
    return;
  }

  if (categoryTag === "investment") {
    if (savings_account_id || debt_account_id) {
      throw new Error(
        "Investment categories may only link to an investment account."
      );
    }
    return;
  }

  if (categoryTag === "debt_payment") {
    if (savings_account_id || investment_account_id) {
      throw new Error(
        "Debt Payment categories may only link to a debt account."
      );
    }
  }
}

function assertPaymentSourceNotSameAsDestination({
  destinationLinks,
  paymentSources,
}: {
  destinationLinks: TransactionLinkInput;
  paymentSources: TransactionPaymentSourceInput;
}) {
  if (
    destinationLinks.savings_account_id &&
    paymentSources.payment_savings_account_id &&
    destinationLinks.savings_account_id === paymentSources.payment_savings_account_id
  ) {
    throw new Error(
      "Payment savings account cannot be the same as the destination savings account."
    );
  }

  if (
    destinationLinks.investment_account_id &&
    paymentSources.payment_investment_account_id &&
    destinationLinks.investment_account_id ===
      paymentSources.payment_investment_account_id
  ) {
    throw new Error(
      "Payment investment account cannot be the same as the destination investment account."
    );
  }

  if (
    destinationLinks.debt_account_id &&
    paymentSources.payment_debt_account_id &&
    destinationLinks.debt_account_id === paymentSources.payment_debt_account_id
  ) {
    throw new Error(
      "Payment debt account cannot be the same as the destination debt account."
    );
  }
}

function resolveMonthRedirectPath(month: unknown): string {
  const value = typeof month === "string" ? month : "";

  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return `/app/transactions?month=${value}`;
  }

  return "/app/transactions";
}

export async function createTransaction(input: unknown) {
  const parsed = transactionSchema.parse(input);

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const { categoryType, categoryTag } = await getTenantCategory({
    categoryId: parsed.category_id,
    tenantId: membership.tenant_id,
  });

  assertCategoryCompatibleLink({
    categoryType,
    categoryTag,
    destinationLinks: {
      savings_account_id: parsed.savings_account_id,
      investment_account_id: parsed.investment_account_id,
      debt_account_id: parsed.debt_account_id,
    },
    paymentSources: {
      payment_savings_account_id: parsed.payment_savings_account_id,
      payment_investment_account_id: parsed.payment_investment_account_id,
      payment_debt_account_id: parsed.payment_debt_account_id,
    },
  });

  assertPaymentSourceNotSameAsDestination({
    destinationLinks: {
      savings_account_id: parsed.savings_account_id,
      investment_account_id: parsed.investment_account_id,
      debt_account_id: parsed.debt_account_id,
    },
    paymentSources: {
      payment_savings_account_id: parsed.payment_savings_account_id,
      payment_investment_account_id: parsed.payment_investment_account_id,
      payment_debt_account_id: parsed.payment_debt_account_id,
    },
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "savings_accounts",
    accountId: parsed.savings_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "investment_accounts",
    accountId: parsed.investment_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "debt_accounts",
    accountId: parsed.debt_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "savings_accounts",
    accountId: parsed.payment_savings_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "investment_accounts",
    accountId: parsed.payment_investment_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "debt_accounts",
    accountId: parsed.payment_debt_account_id,
    tenantId: membership.tenant_id,
  });

  const { error: insertError } = await supabase.from("transactions").insert({
    tenant_id: membership.tenant_id,
    created_by_user_id: user.id,
    category_id: parsed.category_id,
    description: parsed.description,
    amount: parsed.amount,
    transaction_date: parsed.transaction_date,
    transaction_type: categoryType,
    savings_account_id: parsed.savings_account_id,
    investment_account_id: parsed.investment_account_id,
    debt_account_id: parsed.debt_account_id,
    payment_savings_account_id: parsed.payment_savings_account_id,
    payment_investment_account_id: parsed.payment_investment_account_id,
    payment_debt_account_id: parsed.payment_debt_account_id,
  });

  if (insertError) {
    throw new Error(`Failed to create transaction: ${insertError.message}`);
  }

  revalidatePath("/app/transactions");

  return { success: true };
}

export async function updateTransaction(input: unknown) {
  const parsed = updateTransactionSchema.parse(input);
  const redirectPath = resolveMonthRedirectPath(
    (input as { month?: unknown })?.month
  );

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const { data: existingTransaction, error: existingError } = await supabase
    .from("transactions")
    .select("id")
    .eq("id", parsed.id)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to load transaction: ${existingError.message}`);
  }

  if (!existingTransaction) {
    throw new Error("Transaction not found in current tenant");
  }

  const { categoryType, categoryTag } = await getTenantCategory({
    categoryId: parsed.category_id,
    tenantId: membership.tenant_id,
  });

  assertCategoryCompatibleLink({
    categoryType,
    categoryTag,
    destinationLinks: {
      savings_account_id: parsed.savings_account_id,
      investment_account_id: parsed.investment_account_id,
      debt_account_id: parsed.debt_account_id,
    },
    paymentSources: {
      payment_savings_account_id: parsed.payment_savings_account_id,
      payment_investment_account_id: parsed.payment_investment_account_id,
      payment_debt_account_id: parsed.payment_debt_account_id,
    },
  });

  assertPaymentSourceNotSameAsDestination({
    destinationLinks: {
      savings_account_id: parsed.savings_account_id,
      investment_account_id: parsed.investment_account_id,
      debt_account_id: parsed.debt_account_id,
    },
    paymentSources: {
      payment_savings_account_id: parsed.payment_savings_account_id,
      payment_investment_account_id: parsed.payment_investment_account_id,
      payment_debt_account_id: parsed.payment_debt_account_id,
    },
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "savings_accounts",
    accountId: parsed.savings_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "investment_accounts",
    accountId: parsed.investment_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "debt_accounts",
    accountId: parsed.debt_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "savings_accounts",
    accountId: parsed.payment_savings_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "investment_accounts",
    accountId: parsed.payment_investment_account_id,
    tenantId: membership.tenant_id,
  });

  await assertLinkedAccountBelongsToTenant({
    supabase,
    table: "debt_accounts",
    accountId: parsed.payment_debt_account_id,
    tenantId: membership.tenant_id,
  });

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      description: parsed.description,
      amount: parsed.amount,
      transaction_date: parsed.transaction_date,
      category_id: parsed.category_id,
      transaction_type: categoryType,
      savings_account_id: parsed.savings_account_id,
      investment_account_id: parsed.investment_account_id,
      debt_account_id: parsed.debt_account_id,
      payment_savings_account_id: parsed.payment_savings_account_id,
      payment_investment_account_id: parsed.payment_investment_account_id,
      payment_debt_account_id: parsed.payment_debt_account_id,
    })
    .eq("id", parsed.id)
    .eq("tenant_id", membership.tenant_id);

  if (updateError) {
    throw new Error(`Failed to update transaction: ${updateError.message}`);
  }

  revalidatePath("/app/transactions");
  redirect(redirectPath);
}

export async function deleteTransaction(input: unknown) {
  const parsed = deleteTransactionSchema.parse(input);
  const redirectPath = resolveMonthRedirectPath(
    (input as { month?: unknown })?.month
  );

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const { data: existingTransaction, error: existingError } = await supabase
    .from("transactions")
    .select("id")
    .eq("id", parsed.id)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to load transaction: ${existingError.message}`);
  }

  if (!existingTransaction) {
    throw new Error("Transaction not found in current tenant");
  }

  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("id", parsed.id)
    .eq("tenant_id", membership.tenant_id);

  if (deleteError) {
    throw new Error(`Failed to delete transaction: ${deleteError.message}`);
  }

  revalidatePath("/app/transactions");
  redirect(redirectPath);
}
