"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  createSavingsAccountSchema,
  deleteSavingsAccountSchema,
  toAccountNumberLast4,
  updateSavingsAccountSchema,
} from "@/lib/validation/savings-account";

type SavingsField = "purpose" | "account_number";

export type SavingsAccountFormState = {
  message: string;
  fieldErrors?: Partial<Record<SavingsField, string>>;
};

export const initialSavingsAccountFormState: SavingsAccountFormState = {
  message: "",
};

function buildFieldErrors(
  error: z.ZodError
): Partial<Record<SavingsField, string>> {
  const fieldErrors: Partial<Record<SavingsField, string>> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if ((key === "purpose" || key === "account_number") && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

function mapMutationError(
  error: unknown,
  defaultMessage: string
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  ) {
    const code = String((error as { code?: unknown }).code ?? "");
    const message = String((error as { message?: unknown }).message ?? "");

    if (code === "23503") {
      return "This account cannot be removed because dependent records still reference it.";
    }

    if (code === "23505") {
      return "A savings account with this purpose already exists for your tenant.";
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

export async function createSavingsAccountFormAction(
  _prevState: SavingsAccountFormState,
  formData: FormData
): Promise<SavingsAccountFormState> {
  const parsed = createSavingsAccountSchema.safeParse({
    purpose: String(formData.get("purpose") ?? ""),
    account_number: String(formData.get("account_number") ?? ""),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: buildFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();
  const accountNumberLast4 = toAccountNumberLast4(parsed.data.account_number);

  const { error } = await supabase.from("savings_accounts").insert({
    tenant_id: membership.tenant_id,
    purpose: parsed.data.purpose,
    account_number_last4: accountNumberLast4,
  });

  if (error) {
    return {
      message: mapMutationError(error, "Failed to create savings account."),
    };
  }

  revalidatePath("/app/accounts/savings");
  return { message: "Savings account created." };
}

export async function updateSavingsAccountFormAction(
  _prevState: SavingsAccountFormState,
  formData: FormData
): Promise<SavingsAccountFormState> {
  const parsed = updateSavingsAccountSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
    account_number: String(formData.get("account_number") ?? ""),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: buildFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();
  const accountNumberLast4 = toAccountNumberLast4(parsed.data.account_number);

  const { error } = await supabase
    .from("savings_accounts")
    .update({
      purpose: parsed.data.purpose,
      account_number_last4: accountNumberLast4,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("tenant_id", membership.tenant_id);

  if (error) {
    return {
      message: mapMutationError(error, "Failed to update savings account."),
    };
  }

  revalidatePath("/app/accounts/savings");
  return { message: "Saved." };
}

export async function deleteSavingsAccountFormAction(
  _prevState: SavingsAccountFormState,
  formData: FormData
): Promise<SavingsAccountFormState> {
  const parsed = deleteSavingsAccountSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    return { message: "Invalid savings account id." };
  }

  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();

  const { error } = await supabase
    .from("savings_accounts")
    .delete()
    .eq("id", parsed.data.id)
    .eq("tenant_id", membership.tenant_id);

  if (error) {
    return {
      message: mapMutationError(error, "Failed to remove savings account."),
    };
  }

  revalidatePath("/app/accounts/savings");
  return { message: "Savings account removed." };
}
