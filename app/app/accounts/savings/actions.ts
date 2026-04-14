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

type SavingsField = "purpose" | "account_number" | "target_amount" | "target_date";

export type SavingsAccountFormState = {
  message: string;
  fieldErrors?: Partial<Record<SavingsField, string>>;
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
    if ((key === "target_amount" || key === "target_date") && !fieldErrors[key]) {
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
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = createSavingsAccountSchema.safeParse({
      purpose: String(formData.get("purpose") ?? ""),
      account_number: String(formData.get("account_number") ?? ""),
      target_amount: String(formData.get("target_amount") ?? ""),
      target_date: String(formData.get("target_date") ?? ""),
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
      target_amount: parsed.data.target_amount,
      target_date: parsed.data.target_date,
    });

    if (error) {
      return {
        message: mapMutationError(error, "Failed to create savings account."),
      };
    }

    revalidatePath("/app/accounts/savings");
    return { message: "Savings account created." };
  } catch (error) {
    console.error("[savings_accounts.create] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to create savings account."),
    };
  }
}

export async function updateSavingsAccountFormAction(
  _prevState: SavingsAccountFormState,
  formData: FormData
): Promise<SavingsAccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = updateSavingsAccountSchema.safeParse({
      id: String(formData.get("id") ?? ""),
      purpose: String(formData.get("purpose") ?? ""),
      account_number: String(formData.get("account_number") ?? ""),
      target_amount: String(formData.get("target_amount") ?? ""),
      target_date: String(formData.get("target_date") ?? ""),
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
        target_amount: parsed.data.target_amount,
        target_date: parsed.data.target_date,
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
  } catch (error) {
    console.error("[savings_accounts.update] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to update savings account."),
    };
  }
}

export async function deleteSavingsAccountFormAction(
  _prevState: SavingsAccountFormState,
  formData: FormData
): Promise<SavingsAccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

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
  } catch (error) {
    console.error("[savings_accounts.delete] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to remove savings account."),
    };
  }
}
