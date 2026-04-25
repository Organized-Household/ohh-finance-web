"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptInvite(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!firstName || !lastName) {
    return { error: "First name and last name are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Invalid or expired invite link. Please request a new invitation." };
  }

  // Update password
  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) {
    return { error: pwError.message };
  }

  // Find pending invitation for this email using admin client (bypasses RLS)
  const { data: invitation, error: inviteError } = await supabaseAdmin
    .from("invitations")
    .select("id, tenant_id, role")
    .eq("email", user.email!)
    .eq("status", "pending")
    .maybeSingle();

  if (inviteError || !invitation) {
    return { error: "No pending invitation found for this account." };
  }

  // Create profiles row — use admin client since user has no tenant membership yet
  await supabaseAdmin.from("profiles").upsert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
  });

  // Create tenant_members row via admin client (bypasses RLS — user not yet a member)
  const { error: memberError } = await supabaseAdmin
    .from("tenant_members")
    .insert({
      tenant_id: invitation.tenant_id,
      user_id: user.id,
      role: invitation.role,
    });

  if (memberError) {
    return { error: memberError.message };
  }

  // Mark invitation accepted
  await supabaseAdmin
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  redirect("/app");
}
