import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  // Load existing profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

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
        email={user.email ?? ""}
      />
    </WorkspaceShell>
  );
}
