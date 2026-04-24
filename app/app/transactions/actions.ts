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

// Signed amount convention: income = positive, expense = negative.
// Applied server-side on every write — users never enter negative numbers.
function applySignConvention(
  amount: number,
  transactionType: "income" | "expense"
): number {
  const abs = Math.abs(amount);
  return transactionType === "expense" ? -abs : abs;
}

type TransactionAccountLinkInput = {
  linked_account_id: string | null;
  payment_source_account_id: string | null;
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

async function assertAccountBelongsToTenant({
  supabase,
  accountId,
  tenantId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  accountId: string | null;
  tenantId: string;
}): Promise<void> {
  if (!accountId) return;

  const { data, error } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", accountId)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Account does not belong to this tenant");
  }
}

async function assertCategoryCompatibleLink({
  supabase,
  categoryTag,
  linkedAccountId,
  tenantId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  categoryTag: CategoryTag;
  linkedAccountId: string | null;
  tenantId: string;
}): Promise<void> {
  if (!linkedAccountId) return;

  const { data: account, error } = await supabase
    .from("accounts")
    .select("account_kind, account_subtype")
    .eq("id", linkedAccountId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !account) {
    throw new Error("Linked account not found");
  }

  const { account_kind } = account;

  // Design rule: Standard expense may link to any account kind including debt (credit card purchase).
  // debt_payment tag is reserved for actual payments toward a debt.
  if (categoryTag === "savings" && account_kind !== "savings") {
    throw new Error("Savings category must link to a savings account");
  }
  if (categoryTag === "investment" && account_kind !== "investment") {
    throw new Error("Investment category must link to an investment account");
  }
  if (categoryTag === "debt_payment" && account_kind !== "debt") {
    throw new Error("Debt payment category must link to a debt account");
  }
  // standard tag: any account_kind is allowed
}

function assertPaymentSourceNotSameAsDestination(
  linked_account_id: string | null,
  payment_source_account_id: string | null
): void {
  if (
    linked_account_id &&
    payment_source_account_id &&
    linked_account_id === payment_source_account_id
  ) {
    throw new Error(
      "Linked account and payment source cannot be the same account"
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

  if (
    categoryType === "income" &&
    (parsed.linked_account_id || parsed.payment_source_account_id)
  ) {
    throw new Error("Income transactions cannot include linked accounts.");
  }

  await assertAccountBelongsToTenant({
    supabase,
    accountId: parsed.linked_account_id,
    tenantId: membership.tenant_id,
  });

  await assertAccountBelongsToTenant({
    supabase,
    accountId: parsed.payment_source_account_id,
    tenantId: membership.tenant_id,
  });

  assertPaymentSourceNotSameAsDestination(
    parsed.linked_account_id,
    parsed.payment_source_account_id
  );

  await assertCategoryCompatibleLink({
    supabase,
    categoryTag,
    linkedAccountId: parsed.linked_account_id,
    tenantId: membership.tenant_id,
  });

  const { error: insertError } = await supabase.from("transactions").insert({
    tenant_id: membership.tenant_id,
    created_by_user_id: user.id,
    category_id: parsed.category_id,
    description: parsed.description,
    amount: applySignConvention(parsed.amount, categoryType),
    transaction_date: parsed.transaction_date,
    transaction_type: categoryType,
    linked_account_id: parsed.linked_account_id,
    payment_source_account_id: parsed.payment_source_account_id,
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

  if (
    categoryType === "income" &&
    (parsed.linked_account_id || parsed.payment_source_account_id)
  ) {
    throw new Error("Income transactions cannot include linked accounts.");
  }

  await assertAccountBelongsToTenant({
    supabase,
    accountId: parsed.linked_account_id,
    tenantId: membership.tenant_id,
  });

  await assertAccountBelongsToTenant({
    supabase,
    accountId: parsed.payment_source_account_id,
    tenantId: membership.tenant_id,
  });

  assertPaymentSourceNotSameAsDestination(
    parsed.linked_account_id,
    parsed.payment_source_account_id
  );

  await assertCategoryCompatibleLink({
    supabase,
    categoryTag,
    linkedAccountId: parsed.linked_account_id,
    tenantId: membership.tenant_id,
  });

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      description: parsed.description,
      amount: applySignConvention(parsed.amount, categoryType),
      transaction_date: parsed.transaction_date,
      category_id: parsed.category_id,
      transaction_type: categoryType,
      linked_account_id: parsed.linked_account_id,
      payment_source_account_id: parsed.payment_source_account_id,
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
