"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import { revalidatePath } from "next/cache";

type CategoryTag = "debts" | "standard" | "savings" | "investment" | "charity";

interface Category {
  id: string;
  name: string;
  tag: CategoryTag;
}

interface Account {
  id: string;
  account_kind: "savings" | "investment" | "debt";
}

function assertCategoryCompatibleLink(
  categoryTag: CategoryTag,
  accountKind: "savings" | "investment" | "debt" | null
): void {
  if (accountKind === "debt" && categoryTag !== "debts") {
    throw new Error(
      "Cannot link a debt account to a transaction that is not tagged as debts"
    );
  }
  if (accountKind === "savings" && categoryTag !== "savings") {
    throw new Error(
      "Cannot link a savings account to a transaction that is not tagged as savings"
    );
  }
  if (accountKind === "investment" && categoryTag !== "investment") {
    throw new Error(
      "Cannot link an investment account to a transaction that is not tagged as investment"
    );
  }
}

export async function createTransaction(data: {
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "income" | "expense";
  category_id: string;
  account_id?: string | null;
}) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  if (!membership) {
    throw new Error("No tenant membership found");
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("Not authenticated");
  }

  // Fetch category to validate tag/account compatibility
  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id, name, tag")
    .eq("id", data.category_id)
    .eq("tenant_id", membership.tenant_id)
    .single();

  if (catError || !category) {
    throw new Error("Invalid category");
  }

  let accountKind: "savings" | "investment" | "debt" | null = null;
  if (data.account_id) {
    const { data: account, error: accError } = await supabase
      .from("accounts")
      .select("id, account_kind")
      .eq("id", data.account_id)
      .eq("tenant_id", membership.tenant_id)
      .single();

    if (accError || !account) {
      throw new Error("Invalid account");
    }
    accountKind = account.account_kind;
  }

  assertCategoryCompatibleLink(category.tag as CategoryTag, accountKind);

  const { error } = await supabase.from("transactions").insert({
    tenant_id: membership.tenant_id,
    transaction_date: data.transaction_date,
    description: data.description,
    amount: data.amount,
    transaction_type: data.transaction_type,
    category_id: data.category_id,
    account_id: data.account_id || null,
    created_by_user_id: user.user.id,
  });

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  revalidatePath("/app/transactions");
  revalidatePath("/app/dashboard");
}

export async function updateTransaction(
  id: string,
  data: {
    transaction_date?: string;
    description?: string;
    amount?: number;
    transaction_type?: "income" | "expense";
    category_id?: string;
    account_id?: string | null;
  }
) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  if (!membership) {
    throw new Error("No tenant membership found");
  }

  // Fetch existing transaction to validate ownership
  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("id, tenant_id, category_id, account_id")
    .eq("id", id)
    .eq("tenant_id", membership.tenant_id)
    .single();

  if (fetchError || !existing) {
    throw new Error("Transaction not found or access denied");
  }

  const finalCategoryId = data.category_id || existing.category_id;
  const finalAccountId =
    data.account_id !== undefined ? data.account_id : existing.account_id;

  // Fetch category
  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id, name, tag")
    .eq("id", finalCategoryId)
    .eq("tenant_id", membership.tenant_id)
    .single();

  if (catError || !category) {
    throw new Error("Invalid category");
  }

  let accountKind: "savings" | "investment" | "debt" | null = null;
  if (finalAccountId) {
    const { data: account, error: accError } = await supabase
      .from("accounts")
      .select("id, account_kind")
      .eq("id", finalAccountId)
      .eq("tenant_id", membership.tenant_id)
      .single();

    if (accError || !account) {
      throw new Error("Invalid account");
    }
    accountKind = account.account_kind;
  }

  assertCategoryCompatibleLink(category.tag as CategoryTag, accountKind);

  const { error } = await supabase
    .from("transactions")
    .update(data)
    .eq("id", id)
    .eq("tenant_id", membership.tenant_id);

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  revalidatePath("/app/transactions");
  revalidatePath("/app/dashboard");
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  if (!membership) {
    throw new Error("No tenant membership found");
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", membership.tenant_id);

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }

  revalidatePath("/app/transactions");
  revalidatePath("/app/dashboard");
}
