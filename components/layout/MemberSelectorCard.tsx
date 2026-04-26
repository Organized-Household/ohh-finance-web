import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import MemberSelectorCardClient, {
  type MemberItem,
} from "./MemberSelectorCardClient";

export default async function MemberSelectorCard() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  const membership = await getCurrentTenantMembership();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id ?? "";

  // Use admin client so tenant_members RLS (which limits the regular client
  // to the current user's own row) does not hide other household members.
  const { data: membersData } = await supabaseAdmin
    .from("tenant_members")
    .select("user_id, created_at")
    .eq("tenant_id", membership.tenant_id)
    .order("created_at", { ascending: true });

  const memberUserIds = (membersData ?? []).map((m) => m.user_id);

  // Admin client also bypasses the profiles RLS for cross-member reads.
  const { data: profilesData } = await supabaseAdmin
    .from("profiles")
    .select("user_id, first_name, last_name, display_name")
    .in(
      "user_id",
      memberUserIds.length > 0
        ? memberUserIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  const profileMap = new Map(
    (profilesData ?? []).map((p) => [p.user_id, p])
  );

  const members: MemberItem[] = (membersData ?? []).map((m) => {
    const profile = profileMap.get(m.user_id);
    let displayLabel: string;

    if (profile?.first_name && profile.last_name) {
      displayLabel = `${profile.first_name} ${profile.last_name}`;
    } else if (profile?.display_name) {
      displayLabel = profile.display_name;
    } else {
      displayLabel = "Member";
    }

    return { userId: m.user_id, displayLabel };
  });

  return (
    <MemberSelectorCardClient
      members={members}
      currentUserId={currentUserId}
    />
  );
}
