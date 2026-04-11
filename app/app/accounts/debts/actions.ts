"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  createDebtAccountSchema,
  deleteDebtAccountSchema,
  updateDebtAccountSchema,
} from "@/lib/validation/debt-account";

type DebtField = "name" | "type";

export type DebtAccountFormState = {
  message: string;
  fieldErrors?: Partial<Record<DebtField, string>>;
};

function buildFieldErrors(
  error: z.ZodError
): Partial<Record<DebtField, string>> {
  const fieldErrors: Partial<Record<DebtField, string>> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if ((key === "name" || key === "type") && !fieldErrors[key]) {
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
      return "This debt account cannot be removed because dependent records still reference it.";
    }

    if (code === "23505") {
      return "A debt account with this name and type already exists for your tenant.";
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

export async function createDebtAccountFormAction(
  _prevState: DebtAccountFormState,
  formData: FormData
): Promise<DebtAccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = createDebtAccountSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? ""),
    });

    if (!parsed.success) {
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: buildFieldErrors(parsed.error),
      };
    }

    const supabase = await createClient();
    const membership = await getCurrentTenantMembership();

    const { error } = await supabase.from("debt_accounts").insert({
      tenant_id: membership.tenant_id,
      name: parsed.data.name,
      type: parsed.data.type,
    });

    if (error) {
      return {
        message: mapMutationError(error, "Failed to create debt account."),
      };
    }

    revalidatePath("/app/accounts/debts");
    return { message: "Debt account created." };
  } catch (error) {
    console.error("[debt_accounts.create] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to create debt account."),
    };
  }
}

export async function updateDebtAccountFormAction(
  _prevState: DebtAccountFormState,
  formData: FormData
): Promise<DebtAccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = updateDebtAccountSchema.safeParse({
      id: String(formData.get("id") ?? ""),
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? ""),
    });

    if (!parsed.success) {
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: buildFieldErrors(parsed.error),
      };
    }

    const supabase = await createClient();
    const membership = await getCurrentTenantMembership();

    const { error } = await supabase
      .from("debt_accounts")
      .update({
        name: parsed.data.name,
        type: parsed.data.type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id);

    if (error) {
      return {
        message: mapMutationError(error, "Failed to update debt account."),
      };
    }

    revalidatePath("/app/accounts/debts");
    return { message: "Saved." };
  } catch (error) {
    console.error("[debt_accounts.update] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to update debt account."),
    };
  }
}

export async function deleteDebtAccountFormAction(
  _prevState: DebtAccountFormState,
  formData: FormData
): Promise<DebtAccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = deleteDebtAccountSchema.safeParse({
      id: String(formData.get("id") ?? ""),
    });

    if (!parsed.success) {
      return { message: "Invalid debt account id." };
    }

    const supabase = await createClient();
    const membership = await getCurrentTenantMembership();

    const { error } = await supabase
      .from("debt_accounts")
      .delete()
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id);

    if (error) {
      return {
        message: mapMutationError(error, "Failed to remove debt account."),
      };
    }

    revalidatePath("/app/accounts/debts");
    return { message: "Debt account removed." };
  } catch (error) {
    console.error("[debt_accounts.delete] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to remove debt account."),
    };
  }
}
