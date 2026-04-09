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

async function getTenantCategoryType({
  categoryId,
  tenantId,
}: {
  categoryId: string;
  tenantId: string;
}) {
  const supabase = await createClient();
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, category_type")
    .eq("id", categoryId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (categoryError) {
    throw new Error(`Failed to load category: ${categoryError.message}`);
  }

  if (!category) {
    throw new Error("Category not found in current tenant");
  }

  return category.category_type as "income" | "expense";
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

  const categoryType = await getTenantCategoryType({
    categoryId: parsed.category_id,
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

  const categoryType = await getTenantCategoryType({
    categoryId: parsed.category_id,
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
