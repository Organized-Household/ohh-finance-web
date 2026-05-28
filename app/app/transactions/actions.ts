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

// ─── updateTransactionInline ──────────────────────────────────────────────────
// Called by the client-side inline row editor in transaction-table.tsx.
// Same validation and tenant isolation as updateTransaction, but returns a
// result object instead of redirecting — the caller handles UI state refresh.
export async function updateTransactionInline(
  id: string,
  data: {
    transaction_date: string;
    description: string;
    category_id: string;
    linked_account_id: string | null;
    payment_source_account_id: string | null;
    amount: number;
    transaction_type: "income" | "expense";
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const membership = await getCurrentTenantMembership();

    if (!membership) {
      return { ok: false, error: "No tenant membership found" };
    }

    // Validate transaction belongs to this tenant
    const { data: existing, error: fetchError } = await supabase
      .from("transactions")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", membership.tenant_id)
      .single();

    if (fetchError || !existing) {
      return { ok: false, error: "Transaction not found or access denied" };
    }

    // Validate category belongs to this tenant
    const { data: category, error: catError } = await supabase
      .from("categories")
      .select("id, name, tag")
      .eq("id", data.category_id)
      .eq("tenant_id", membership.tenant_id)
      .single();

    if (catError || !category) {
      return { ok: false, error: "Invalid category" };
    }

    // Validate linked account and assert category/account kind compatibility
    if (data.linked_account_id) {
      const { data: linkedAccount, error: linkedAccError } = await supabase
        .from("accounts")
        .select("id, account_kind")
        .eq("id", data.linked_account_id)
        .eq("tenant_id", membership.tenant_id)
        .single();

      if (linkedAccError || !linkedAccount) {
        return { ok: false, error: "Invalid linked account" };
      }

      assertCategoryCompatibleLink(
        category.tag as CategoryTag,
        linkedAccount.account_kind
      );
    }

    // Validate payment source account belongs to this tenant
    if (data.payment_source_account_id) {
      const { data: sourceAccount, error: sourceAccError } = await supabase
        .from("accounts")
        .select("id")
        .eq("id", data.payment_source_account_id)
        .eq("tenant_id", membership.tenant_id)
        .single();

      if (sourceAccError || !sourceAccount) {
        return { ok: false, error: "Invalid payment source account" };
      }
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        transaction_date: data.transaction_date,
        description: data.description,
        category_id: data.category_id,
        linked_account_id: data.linked_account_id,
        payment_source_account_id: data.payment_source_account_id,
        amount: data.amount,
        transaction_type: data.transaction_type,
      })
      .eq("id", id)
      .eq("tenant_id", membership.tenant_id);

    if (error) {
      return { ok: false, error: `Failed to update transaction: ${error.message}` };
    }

    revalidatePath("/app/transactions");
    revalidatePath("/app/dashboard");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

// ─── deleteTransactionInline ──────────────────────────────────────────────────
// Called by the client-side delete button in transaction-table.tsx.
// Same logic as deleteTransaction but returns a result object instead of
// redirecting — the caller calls router.refresh() on success.
export async function deleteTransactionInline(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const membership = await getCurrentTenantMembership();

    if (!membership) {
      return { ok: false, error: "No tenant membership found" };
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("tenant_id", membership.tenant_id);

    if (error) {
      return { ok: false, error: `Failed to delete transaction: ${error.message}` };
    }

    revalidatePath("/app/transactions");
    revalidatePath("/app/dashboard");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}
