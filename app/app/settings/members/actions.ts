"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteMember(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") ?? "member");

  if (!email) return { error: "Email is required." };
  if (!["admin", "member"].includes(role)) return { error: "Invalid role." };

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  // Verify caller is admin
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    return { error: "Only admins can invite members." };
  }

  const tenantId = membership.tenant_id;

  // Insert invitation record — DB unique constraint catches duplicate pending invites
  const { error: insertError } = await supabase.from("invitations").insert({
    tenant_id: tenantId,
    email,
    role,
    invited_by: user.id,
    status: "pending",
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "This email already has a pending invitation." };
    }
    return { error: insertError.message };
  }

  // Send invite via Supabase Auth
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite`,
    }
  );

  if (inviteError) {
    // Roll back invitation record on email failure
    await supabase
      .from("invitations")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .eq("status", "pending");

    return { error: inviteError.message };
  }

  revalidatePath("/app/settings/members");
  return { success: true };
}

export async function revokeInvitation(
  invitationId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // Verify caller is admin (defense in depth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    return { error: "Only admins can revoke invitations." };
  }

  // Use admin client — RLS update policy may silently block standard client
  const { error } = await supabaseAdmin
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);

  if (error) {
    console.error("[revokeInvitation] DB error:", error.message);
    return { error: error.message };
  }

  revalidatePath("/app/settings/members");
  return { success: true };
}

export async function updateMemberRole(
  targetUserId: string,
  newRole: "admin" | "member"
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: callerMembership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!callerMembership || callerMembership.role !== "admin") {
    return { error: "Only admins can change member roles." };
  }

  if (targetUserId === user.id) {
    return { error: "You cannot change your own role." };
  }

  const tenantId = callerMembership.tenant_id;

  if (newRole === "admin") {
    const { count } = await supabaseAdmin
      .from("tenant_members")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "admin");

    if ((count ?? 0) >= 2) {
      return { error: "Maximum of 2 admins allowed per household." };
    }
  }

  if (newRole === "member") {
    const { count } = await supabaseAdmin
      .from("tenant_members")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return {
        error: "Cannot demote the last admin. Promote another member first.",
      };
    }
  }

  const { error } = await supabaseAdmin
    .from("tenant_members")
    .update({ role: newRole })
    .eq("tenant_id", tenantId)
    .eq("user_id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath("/app/settings/members");
  return { success: true };
}

export async function removeMember(
  targetUserId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: callerMembership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!callerMembership || callerMembership.role !== "admin") {
    return { error: "Only admins can remove members." };
  }

  if (targetUserId === user.id) {
    return { error: "You cannot remove yourself." };
  }

  const { error } = await supabaseAdmin
    .from("tenant_members")
    .delete()
    .eq("tenant_id", callerMembership.tenant_id)
    .eq("user_id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath("/app/settings/members");
  return { success: true };
}
