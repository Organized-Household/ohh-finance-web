"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "@/lib/validation/category";
import { z } from "zod";

type CategoryField = "name" | "tag" | "category_type";

export type CategoryFormState = {
  message: string;
  fieldErrors?: Partial<Record<CategoryField, string>>;
};

function buildFieldErrors(
  error: z.ZodError
): Partial<Record<CategoryField, string>> {
  const fieldErrors: Partial<Record<CategoryField, string>> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (
      (key === "name" || key === "tag" || key === "category_type") &&
      !fieldErrors[key]
    ) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

function mapMutationError(error: unknown, defaultMessage: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  ) {
    const code = String((error as { code?: unknown }).code ?? "");
    const message = String((error as { message?: unknown }).message ?? "");

    if (code === "23503") {
      return "Category cannot be deleted because it is still used in budgets or transactions. Remove those dependencies first. If it is budgeted, set the budget amount to 0 before deleting.";
    }

    if (message) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return defaultMessage;
}

const categoryDependencyMessage =
  "Category cannot be deleted because it is still used in budgets or transactions. Remove those dependencies first. If it is budgeted, set the budget amount to 0 before deleting.";

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

export async function createCategoryFormAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const parsed = createCategorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    tag: String(formData.get("tag") ?? "standard"),
    category_type: String(formData.get("category_type") ?? "expense"),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: buildFieldErrors(parsed.error),
    };
  }

  try {
    await createCategory(parsed.data);
    return { message: "Category created." };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create category.";
    return { message };
  }
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

export async function updateCategoryFormAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const parsed = updateCategorySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    tag: String(formData.get("tag") ?? "standard"),
    category_type: String(formData.get("category_type") ?? "expense"),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: buildFieldErrors(parsed.error),
    };
  }

  try {
    await updateCategory(parsed.data);
    return { message: "Saved." };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update category.";
    return { message };
  }
}

export async function deleteCategory(input: unknown) {
  const parsed = deleteCategorySchema.parse(input);

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { data: transactionDependency, error: transactionDependencyError } =
    await supabase
      .from("transactions")
      .select("id")
      .eq("tenant_id", membership.tenant_id)
      .eq("category_id", parsed.id)
      .limit(1)
      .maybeSingle();

  if (transactionDependencyError) {
    throw new Error(
      `Failed to validate category transaction dependencies: ${transactionDependencyError.message}`
    );
  }

  if (transactionDependency) {
    throw new Error(categoryDependencyMessage);
  }

  const { data: nonZeroBudgetDependency, error: nonZeroBudgetDependencyError } =
    await supabase
      .from("budget_lines")
      .select("id")
      .eq("tenant_id", membership.tenant_id)
      .eq("category_id", parsed.id)
      .neq("amount", 0)
      .limit(1)
      .maybeSingle();

  if (nonZeroBudgetDependencyError) {
    throw new Error(
      `Failed to validate category budget dependencies: ${nonZeroBudgetDependencyError.message}`
    );
  }

  if (nonZeroBudgetDependency) {
    throw new Error(categoryDependencyMessage);
  }

  const { error: zeroBudgetLineCleanupError } = await supabase
    .from("budget_lines")
    .delete()
    .eq("tenant_id", membership.tenant_id)
    .eq("category_id", parsed.id)
    .eq("amount", 0);

  if (zeroBudgetLineCleanupError) {
    throw new Error(
      `Failed to clear zero-amount budget dependencies: ${zeroBudgetLineCleanupError.message}`
    );
  }

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

export async function deleteCategoryFormAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const parsed = deleteCategorySchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    return { message: "Invalid category id." };
  }

  try {
    await deleteCategory(parsed.data);
    return { message: "Category removed." };
  } catch (error) {
    if (error instanceof Error && error.message === categoryDependencyMessage) {
      return { message: categoryDependencyMessage };
    }

    return {
      message: mapMutationError(error, "Failed to delete category."),
    };
  }
}
