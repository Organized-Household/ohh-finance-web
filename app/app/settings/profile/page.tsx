import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const membership = await getCurrentTenantMembership();
  const isAdmin = membership.role === "admin";

  const [
    { data: profile },
    { data: tenantData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, display_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    adminClient
      .from("tenants")
      .select("alias")
      .eq("id", membership.tenant_id)
      .single(),
  ]);

  const leftPanelSections: WorkspaceLeftPanelSection[] = [
    {
      title: "About",
      content: (
        <p className="text-xs text-slate-600">
          Your name is shown to other household members and used throughout the
          app. Keep it up to date so everyone knows who made changes.
        </p>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="My Profile"
      description="Update your name and personal details."
      leftPanelSections={leftPanelSections}
    >
      <ProfileForm
        initialFirstName={profile?.first_name ?? ""}
        initialLastName={profile?.last_name ?? ""}
        initialHouseholdName={tenantData?.alias ?? ""}
        email={user.email ?? ""}
        isAdmin={isAdmin}
      />
    </WorkspaceShell>
  );
}
