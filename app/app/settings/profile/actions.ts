"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "First name and last name are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/settings/profile");
  return { success: true };
}
