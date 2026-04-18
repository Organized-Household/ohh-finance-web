"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import {
  createSavingsAccountSchema,
  updateSavingsAccountSchema,
  deleteSavingsAccountSchema,
  createInvestmentAccountSchema,
  updateInvestmentAccountSchema,
  deleteInvestmentAccountSchema,
  createDebtAccountSchema,
  updateDebtAccountSchema,
  deleteDebtAccountSchema,
  toAccountNumberLast4,
} from "@/lib/validation/account";

export type AccountFormState = {
  message: string;
  fieldErrors?: Partial<Record<string, string>>;
};

function buildFieldErrors(error: z.ZodError): Partial<Record<string, string>> {
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function mapMutationError(
  error: unknown,
  defaultMessage: string,
  duplicateMessage?: string
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
      return duplicateMessage ?? "An account with this name already exists for your tenant.";
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

// ---------------------------------------------------------------------------
// Savings
// ---------------------------------------------------------------------------

export async function createSavingsAccountFormAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = createSavingsAccountSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      account_number: String(formData.get("account_number") ?? ""),
      opening_balance: String(formData.get("opening_balance") ?? ""),
      interest_rate: String(formData.get("interest_rate") ?? ""),
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

    const { error } = await supabase.from("accounts").insert({
      tenant_id: membership.tenant_id,
      account_kind: "savings",
      name: parsed.data.name,
      account_subtype: null,
      account_number_last4: accountNumberLast4,
      opening_balance: parsed.data.opening_balance,
      interest_rate: parsed.data.interest_rate,
      target_amount: parsed.data.target_amount,
      target_date: parsed.data.target_date,
    });

    if (error) {
      return {
        message: mapMutationError(
          error,
          "Failed to create savings account.",
          "A savings account with this name already exists for your tenant."
        ),
      };
    }

    revalidatePath("/app/accounts/savings");
    return { message: "Savings account created." };
  } catch (error) {
    console.error("[accounts.savings.create] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to create savings account."),
    };
  }
}

export async function updateSavingsAccountFormAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = updateSavingsAccountSchema.safeParse({
      id: String(formData.get("id") ?? ""),
      name: String(formData.get("name") ?? ""),
      account_number: String(formData.get("account_number") ?? ""),
      opening_balance: String(formData.get("opening_balance") ?? ""),
      interest_rate: String(formData.get("interest_rate") ?? ""),
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
      .from("accounts")
      .update({
        name: parsed.data.name,
        account_number_last4: accountNumberLast4,
        opening_balance: parsed.data.opening_balance,
        interest_rate: parsed.data.interest_rate,
        target_amount: parsed.data.target_amount,
        target_date: parsed.data.target_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id)
      .eq("account_kind", "savings");

    if (error) {
      return {
        message: mapMutationError(
          error,
          "Failed to update savings account.",
          "A savings account with this name already exists for your tenant."
        ),
      };
    }

    revalidatePath("/app/accounts/savings");
    return { message: "Saved." };
  } catch (error) {
    console.error("[accounts.savings.update] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to update savings account."),
    };
  }
}

export async function deleteSavingsAccountFormAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
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
      .from("accounts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id)
      .eq("account_kind", "savings");

    if (error) {
      return {
        message: mapMutationError(error, "Failed to remove savings account."),
      };
    }

    revalidatePath("/app/accounts/savings");
    return { message: "Savings account removed." };
  } catch (error) {
    console.error("[accounts.savings.delete] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to remove savings account."),
    };
  }
}

// ---------------------------------------------------------------------------
// Investment
// ---------------------------------------------------------------------------

export async function createInvestmentAccountFormAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = createInvestmentAccountSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      account_subtype: String(formData.get("account_subtype") ?? ""),
      opening_balance: String(formData.get("opening_balance") ?? ""),
      interest_rate: String(formData.get("interest_rate") ?? ""),
    });

    if (!parsed.success) {
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: buildFieldErrors(parsed.error),
      };
    }

    const supabase = await createClient();
    const membership = await getCurrentTenantMembership();

    const { error } = await supabase.from("accounts").insert({
      tenant_id: membership.tenant_id,
      account_kind: "investment",
      name: parsed.data.name,
      account_subtype: parsed.data.account_subtype,
      opening_balance: parsed.data.opening_balance,
      interest_rate: parsed.data.interest_rate,
    });

    if (error) {
      return {
        message: mapMutationError(
          error,
          "Failed to create investment account.",
          "An investment account with this name and type already exists for your tenant."
        ),
      };
    }

    revalidatePath("/app/accounts/investments");
    return { message: "Investment account created." };
  } catch (error) {
    console.error("[accounts.investment.create] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to create investment account."),
    };
  }
}

export async function updateInvestmentAccountFormAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = updateInvestmentAccountSchema.safeParse({
      id: String(formData.get("id") ?? ""),
      name: String(formData.get("name") ?? ""),
      account_subtype: String(formData.get("account_subtype") ?? ""),
      opening_balance: String(formData.get("opening_balance") ?? ""),
      interest_rate: String(formData.get("interest_rate") ?? ""),
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
      .from("accounts")
      .update({
        name: parsed.data.name,
        account_subtype: parsed.data.account_subtype,
        opening_balance: parsed.data.opening_balance,
        interest_rate: parsed.data.interest_rate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id)
      .eq("account_kind", "investment");

    if (error) {
      return {
        message: mapMutationError(
          error,
          "Failed to update investment account.",
          "An investment account with this name and type already exists for your tenant."
        ),
      };
    }

    revalidatePath("/app/accounts/investments");
    return { message: "Saved." };
  } catch (error) {
    console.error("[accounts.investment.update] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to update investment account."),
    };
  }
}

export async function deleteInvestmentAccountFormAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
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
      .from("accounts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id)
      .eq("account_kind", "investment");

    if (error) {
      return {
        message: mapMutationError(error, "Failed to remove investment account."),
      };
    }

    revalidatePath("/app/accounts/investments");
    return { message: "Investment account removed." };
  } catch (error) {
    console.error("[accounts.investment.delete] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to remove investment account."),
    };
  }
}

// ---------------------------------------------------------------------------
// Debt
// ---------------------------------------------------------------------------

export async function createDebtAccountFormAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = createDebtAccountSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      account_subtype: String(formData.get("account_subtype") ?? ""),
      opening_balance: String(formData.get("opening_balance") ?? ""),
      interest_rate: String(formData.get("interest_rate") ?? ""),
    });

    if (!parsed.success) {
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: buildFieldErrors(parsed.error),
      };
    }

    const supabase = await createClient();
    const membership = await getCurrentTenantMembership();

    const { error } = await supabase.from("accounts").insert({
      tenant_id: membership.tenant_id,
      account_kind: "debt",
      name: parsed.data.name,
      account_subtype: parsed.data.account_subtype,
      opening_balance: parsed.data.opening_balance,
      interest_rate: parsed.data.interest_rate,
    });

    if (error) {
      return {
        message: mapMutationError(
          error,
          "Failed to create debt account.",
          "A debt account with this name and type already exists for your tenant."
        ),
      };
    }

    revalidatePath("/app/accounts/debts");
    return { message: "Debt account created." };
  } catch (error) {
    console.error("[accounts.debt.create] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to create debt account."),
    };
  }
}

export async function updateDebtAccountFormAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  try {
    if (!(formData instanceof FormData)) {
      return { message: "Invalid form submission. Please try again." };
    }

    const parsed = updateDebtAccountSchema.safeParse({
      id: String(formData.get("id") ?? ""),
      name: String(formData.get("name") ?? ""),
      account_subtype: String(formData.get("account_subtype") ?? ""),
      opening_balance: String(formData.get("opening_balance") ?? ""),
      interest_rate: String(formData.get("interest_rate") ?? ""),
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
      .from("accounts")
      .update({
        name: parsed.data.name,
        account_subtype: parsed.data.account_subtype,
        opening_balance: parsed.data.opening_balance,
        interest_rate: parsed.data.interest_rate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id)
      .eq("account_kind", "debt");

    if (error) {
      return {
        message: mapMutationError(
          error,
          "Failed to update debt account.",
          "A debt account with this name and type already exists for your tenant."
        ),
      };
    }

    revalidatePath("/app/accounts/debts");
    return { message: "Saved." };
  } catch (error) {
    console.error("[accounts.debt.update] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to update debt account."),
    };
  }
}

export async function deleteDebtAccountFormAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
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
      .from("accounts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("tenant_id", membership.tenant_id)
      .eq("account_kind", "debt");

    if (error) {
      return {
        message: mapMutationError(error, "Failed to remove debt account."),
      };
    }

    revalidatePath("/app/accounts/debts");
    return { message: "Debt account removed." };
  } catch (error) {
    console.error("[accounts.debt.delete] unexpected action error", error);
    return {
      message: mapMutationError(error, "Failed to remove debt account."),
    };
  }
}
