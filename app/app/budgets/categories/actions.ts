"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "@/lib/validation/category";

export async function createCategoryAction(formData: FormData) {
  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    tag: formData.get("tag"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid category.");
  }

  const membership = await getCurrentTenantMembership();

  if (membership.role !== "admin") {
    throw new Error("Admin privileges required.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("categories").insert({
    tenant_id: membership.tenant_id,
    name: parsed.data.name,
    tag: parsed.data.tag,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/app/budgets/categories");
}

export async function updateCategoryAction(formData: FormData) {
  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    tag: formData.get("tag"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid category.");
  }

  const membership = await getCurrentTenantMembership();

  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      tag: parsed.data.tag,
    })
    .eq("id", parsed.data.id)
    .eq("tenant_id", membership.tenant_id);

  if (error) throw new Error(error.message);

  revalidatePath("/app/budgets/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const parsed = deleteCategorySchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    throw new Error("Invalid category id.");
  }

  const membership = await getCurrentTenantMembership();

  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", parsed.data.id)
    .eq("tenant_id", membership.tenant_id);

  if (error) throw new Error(error.message);

  revalidatePath("/app/budgets/categories");
}