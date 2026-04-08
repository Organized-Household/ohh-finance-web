"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "@/lib/validation/category";

export async function createCategory(input: unknown) {
  const parsed = createCategorySchema.parse(input);

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { error } = await supabase.from("categories").insert({
    tenant_id: membership.tenant_id,
    name: parsed.name,
    tag: parsed.tag,
    category_type: parsed.category_type,
  });

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  revalidatePath("/app/budgets/categories");

  return { success: true };
}

export async function updateCategory(input: unknown) {
  const parsed = updateCategorySchema.parse(input);

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.name,
      tag: parsed.tag,
      category_type: parsed.category_type,
    })
    .eq("id", parsed.id)
    .eq("tenant_id", membership.tenant_id);

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  revalidatePath("/app/budgets/categories");
  revalidatePath("/app/budgets");

  return { success: true };
}

export async function deleteCategory(input: unknown) {
  const parsed = deleteCategorySchema.parse(input);

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", parsed.id)
    .eq("tenant_id", membership.tenant_id);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  revalidatePath("/app/budgets/categories");
  revalidatePath("/app/budgets");

  return { success: true };
}