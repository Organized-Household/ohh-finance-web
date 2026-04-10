"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema } from "@/lib/validation/register";

type RegisterState = {
  error?: string;
  success?: string;
};

async function bootstrapTenantMembership(params: {
  alias: string;
  userId: string;
}): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { data: tenantData, error: tenantError } = await admin
    .from("tenants")
    .insert({ alias: params.alias })
    .select("id")
    .single();

  if (tenantError || !tenantData) {
    return {
      error: `Failed to create tenant bootstrap records: ${tenantError?.message ?? "tenant not created"}`,
    };
  }

  const { error: membershipError } = await admin.from("tenant_members").insert({
    tenant_id: tenantData.id,
    user_id: params.userId,
    role: "admin",
  });

  if (!membershipError) {
    return {};
  }

  const { error: cleanupError } = await admin
    .from("tenants")
    .delete()
    .eq("id", tenantData.id);

  if (cleanupError) {
    console.error("Failed to roll back tenant after membership insert error", {
      tenantId: tenantData.id,
      cleanupError: cleanupError.message,
      membershipError: membershipError.message,
    });
  }

  return {
    error: `Failed to create tenant bootstrap records: ${membershipError.message}`,
  };
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    alias: String(formData.get("alias") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration input." };
  }

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const userId = signUpData.user?.id;

  if (!userId) {
    return { error: "Registration succeeded but no user id was returned." };
  }

  const bootstrapResult = await bootstrapTenantMembership({
    alias: parsed.data.alias,
    userId,
  });

  if (bootstrapResult.error) {
    return { error: bootstrapResult.error };
  }

  if (!signUpData.session) {
    return {
      success:
        "Registration successful. Please check your email and confirm your account before logging in.",
    };
  }

  redirect("/app");
}
