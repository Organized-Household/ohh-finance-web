"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RegisterState = {
  error?: string;
  success?: string;
};

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const alias = String(formData.get("alias") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!alias || !email || !password) {
    return { error: "Household alias, email, and password are required." };
  }

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const userId = signUpData.user?.id;

  if (!userId) {
    return { error: "Registration succeeded but no user id was returned." };
  }

  const { error: rpcError } = await supabase.rpc("create_tenant_and_membership", {
    p_alias: alias,
    p_user_id: userId,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  if (!signUpData.session) {
    return {
      success:
        "Registration successful. Please check your email and confirm your account before logging in.",
    };
  }

  redirect("/app");
}