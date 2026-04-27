"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export async function createExpenseType(input: {
  name: string;
}): Promise<{ success?: boolean; error?: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };

  const slug = generateSlug(name);
  if (!slug) {
    return { error: "Name produced an invalid slug. Use letters and spaces only." };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("expense_types")
    .insert({ name, slug, is_system: false });

  if (error) {
    if (error.code === "23505") return { error: "This expense type already exists." };
    return { error: error.message };
  }

  revalidatePath("/app/expense-types");
  revalidatePath("/app/budgets/categories");
  return { success: true };
}

export async function toggleExpenseTypeActive(
  id: string,
  isActive: boolean
): Promise<{ success?: boolean; error?: string }> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("expense_types")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("is_system", false); // cannot deactivate system types

  if (error) return { error: error.message };

  revalidatePath("/app/expense-types");
  revalidatePath("/app/budgets/categories");
  return { success: true };
}

export async function deleteExpenseType(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const adminClient = createAdminClient();

  // Guard: cannot delete system types
  const { data: et } = await adminClient
    .from("expense_types")
    .select("is_system, slug")
    .eq("id", id)
    .single();

  if (et?.is_system) {
    return { error: "System expense types cannot be deleted." };
  }

  // Guard: cannot delete if active categories are using this slug
  const { count } = await adminClient
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("tag", et?.slug ?? "")
    .eq("is_active", true);

  if ((count ?? 0) > 0) {
    return {
      error: `This expense type is used by ${count} active ${count === 1 ? "category" : "categories"}. Reassign those categories before deleting.`,
    };
  }

  const { error } = await adminClient
    .from("expense_types")
    .delete()
    .eq("id", id)
    .eq("is_system", false);

  if (error) return { error: error.message };

  revalidatePath("/app/expense-types");
  revalidatePath("/app/budgets/categories");
  return { success: true };
}
