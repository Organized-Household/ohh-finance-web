"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    return `${proto}://${host}/auth/callback`;
  }

  const fallback =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000";

  return `${fallback.replace(/\/$/, "")}/auth/callback`;
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
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

  // Email confirmation disabled (e.g. local dev) — go straight to complete-setup
  // so the user can set their household name and profile.
  redirect("/register/complete-setup");
}
