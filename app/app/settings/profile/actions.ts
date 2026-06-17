"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";

export async function updateProfile(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const householdName = String(formData.get("household_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "First name and last name are required." };
  }

  if (!householdName) {
    return { error: "Household name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const membership = await getCurrentTenantMembership();

  // Only admins can change the household name
  if (membership.role !== "admin") {
    return { error: "Only household admins can change the household name." };
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  // Update household name — requires admin client (no RLS SELECT policy on tenants)
  const adminClient = createAdminClient();
  const { error: tenantError } = await adminClient
    .from("tenants")
    .update({ alias: householdName })
    .eq("id", membership.tenant_id);

  if (tenantError) {
    return { error: tenantError.message };
  }

  revalidatePath("/app/settings/profile");
  return { success: true };
}
