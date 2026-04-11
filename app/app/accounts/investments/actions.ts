"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  createInvestmentAccountSchema,
  deleteInvestmentAccountSchema,
  updateInvestmentAccountSchema,
} from "@/lib/validation/investment-account";

type InvestmentField = "name" | "type";

export type InvestmentAccountFormState = {
  message: string;
  fieldErrors?: Partial<Record<InvestmentField, string>>;
};

function buildFieldErrors(
  error: z.ZodError
): Partial<Record<InvestmentField, string>> {
  const fieldErrors: Partial<Record<InvestmentField, string>> = {};

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
      return "This investment account cannot be removed because dependent records still reference it.";
    }

    if (code === "23505") {
      return "An investment account with this name and type already exists for your tenant.";
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

export async function createInvestmentAccountFormAction(
  _prevState: InvestmentAccountFormState,
  formData: FormData
): Promise<InvestmentAccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = createInvestmentAccountSchema.safeParse({
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

    const { error } = await supabase.from("investment_accounts").insert({
      tenant_id: membership.tenant_id,
      name: parsed.data.name,
      account_type: parsed.data.type,
    });

    if (error) {
      return {
        message: mapMutationError(error, "Failed to create investment account."),
      };
    }

    revalidatePath("/app/accounts/investments");
    return { message: "Investment account created." };
  } catch (error) {
    console.error("[investment_accounts.create] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to create investment account."),
    };
  }
}

export async function updateInvestmentAccountFormAction(
  _prevState: InvestmentAccountFormState,
  formData: FormData
): Promise<InvestmentAccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = updateInvestmentAccountSchema.safeParse({
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
      .from("investment_accounts")
      .update({
        name: parsed.data.name,
        account_type: parsed.data.type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id);

    if (error) {
      return {
        message: mapMutationError(error, "Failed to update investment account."),
      };
    }

    revalidatePath("/app/accounts/investments");
    return { message: "Saved." };
  } catch (error) {
    console.error("[investment_accounts.update] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to update investment account."),
    };
  }
}

export async function deleteInvestmentAccountFormAction(
  _prevState: InvestmentAccountFormState,
  formData: FormData
): Promise<InvestmentAccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = deleteInvestmentAccountSchema.safeParse({
      id: String(formData.get("id") ?? ""),
    });

    if (!parsed.success) {
      return { message: "Invalid investment account id." };
    }

    const supabase = await createClient();
    const membership = await getCurrentTenantMembership();

    const { error } = await supabase
      .from("investment_accounts")
      .delete()
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id);

    if (error) {
      return {
        message: mapMutationError(error, "Failed to remove investment account."),
      };
    }

    revalidatePath("/app/accounts/investments");
    return { message: "Investment account removed." };
  } catch (error) {
    console.error("[investment_accounts.delete] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to remove investment account."),
    };
  }
}
