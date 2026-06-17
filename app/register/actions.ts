"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema } from "@/lib/validation/register";

type RegisterState = {
  error?: string;
  success?: string;
  status?: "email_verification_required";
  email?: string;
};

async function resolveEmailRedirectUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${proto}://${host}/login`;
  }

  const fallback =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000";

  return `${fallback.replace(/\/$/, "")}/login`;
}

async function bootstrapTenantMembership(params: {
  alias: string;
  userId: string;
}): Promise<{ error?: string }> {
  // Service role required: initial tenants + tenant_members INSERT at registration.
  // RLS policies block writes before membership exists (chicken-egg problem).
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
  const emailRedirectTo = await resolveEmailRedirectUrl();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo,
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const userId = signUpData.user?.id;

  if (!userId) {
    return { error: "Registration succeeded but no user id was returned." };
  }

  // OHHFIN-187: When email confirmation is required, session is null.
  // Return email_verification_required status so the page can show the verification prompt.
  if (!signUpData.session) {
    return {
      status: "email_verification_required",
      email: parsed.data.email,
    };
  }

  const bootstrapResult = await bootstrapTenantMembership({
    alias: parsed.data.alias,
    userId,
  });

  if (bootstrapResult.error) {
    return { error: bootstrapResult.error };
  }

  redirect("/app");
}
