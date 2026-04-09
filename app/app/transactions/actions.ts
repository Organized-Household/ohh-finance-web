"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import { transactionSchema } from "@/lib/validation/transaction";

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

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, category_type")
    .eq("id", parsed.category_id)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();

  if (categoryError) {
    throw new Error(`Failed to load category: ${categoryError.message}`);
  }

  if (!category) {
    throw new Error("Category not found in current tenant");
  }

  const { error: insertError } = await supabase.from("transactions").insert({
    tenant_id: membership.tenant_id,
    created_by_user_id: user.id,
    category_id: parsed.category_id,
    description: parsed.description,
    amount: parsed.amount,
    transaction_date: parsed.transaction_date,
    transaction_type: category.category_type,
  });

  if (insertError) {
    throw new Error(`Failed to create transaction: ${insertError.message}`);
  }

  revalidatePath("/app/transactions");

  return { success: true };
}
