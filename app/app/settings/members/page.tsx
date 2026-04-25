import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import InviteForm from "./invite-form";
import RevokeButton from "./revoke-button";

type Member = {
  user_id: string;
  role: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
};

type PendingInvitation = {
  id: string;
  email: string;
  role: string;
  invited_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function MembersPage() {
  const supabase = await createClient();
  const membership = await getCurrentTenantMembership();
  const isAdmin = membership.role === "admin";

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  // Fetch all tenant members
  const { data: membersData, error: membersError } = await supabase
    .from("tenant_members")
    .select("user_id, role, created_at")
    .eq("tenant_id", membership.tenant_id)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(`Failed to load members: ${membersError.message}`);
  }

  // Fetch profiles for all member user IDs
  const memberUserIds = (membersData ?? []).map((m) => m.user_id);
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_name")
    .in("user_id", memberUserIds.length > 0 ? memberUserIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map(
    (profilesData ?? []).map((p) => [p.user_id, p])
  );

  const members: Member[] = (membersData ?? []).map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      user_id: m.user_id,
      role: m.role,
      created_at: String(m.created_at),
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      display_name: profile?.display_name ?? null,
      email: m.user_id === user.id ? (user.email ?? null) : null,
    };
  });

  // Fetch pending invitations (admin only)
  const pendingInvitations: PendingInvitation[] = [];
  if (isAdmin) {
    const { data: invitesData } = await supabase
      .from("invitations")
      .select("id, email, role, invited_at")
      .eq("tenant_id", membership.tenant_id)
      .eq("status", "pending")
      .order("invited_at", { ascending: false });

    for (const inv of invitesData ?? []) {
      pendingInvitations.push({
        id: String(inv.id),
        email: String(inv.email),
        role: String(inv.role),
        invited_at: String(inv.invited_at),
      });
    }
  }

  const thCls =
    "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white";
  const tdCls = "px-3 py-2 text-sm text-slate-700";

  const leftPanelSections: WorkspaceLeftPanelSection[] = [
    {
      title: "Roles",
      content: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">Admin</span> — can
            invite and manage members.
          </p>
          <p>
            <span className="font-semibold text-slate-800">Member</span> — can
            view and manage household data.
          </p>
        </div>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="Household Members"
      description="View all members in your household and manage invitations."
      leftPanelSections={leftPanelSections}
    >
      <div className="space-y-6">
        {/* Active members */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Active Members
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
            <table className="w-full border-collapse">
              <thead className="bg-slate-900">
                <tr>
                  <th className={thCls}>Name</th>
                  <th className={thCls}>Role</th>
                  <th className={thCls}>Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.map((m) => {
                  const name =
                    m.first_name && m.last_name
                      ? `${m.first_name} ${m.last_name}`
                      : (m.display_name ?? "—");
                  const isCurrentUser = m.user_id === user.id;

                  return (
                    <tr key={m.user_id}>
                      <td className={tdCls}>
                        <span className="font-medium text-slate-900">
                          {name}
                        </span>
                        {isCurrentUser && (
                          <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                            you
                          </span>
                        )}
                        {m.email && (
                          <div className="text-xs text-slate-500">{m.email}</div>
                        )}
                      </td>
                      <td className={tdCls + " capitalize"}>{m.role}</td>
                      <td className={tdCls}>{formatDate(m.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pending invitations — admin only */}
        {isAdmin && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              Pending Invitations
            </h2>
            {pendingInvitations.length === 0 ? (
              <p className="text-sm text-slate-500">No pending invitations.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className={thCls}>Email</th>
                      <th className={thCls}>Role</th>
                      <th className={thCls}>Invited</th>
                      <th className={thCls}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pendingInvitations.map((inv) => (
                      <tr key={inv.id}>
                        <td className={tdCls}>{inv.email}</td>
                        <td className={tdCls + " capitalize"}>{inv.role}</td>
                        <td className={tdCls}>{formatDate(inv.invited_at)}</td>
                        <td className={tdCls}>
                          <RevokeButton invitationId={inv.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Invite form — admin only */}
        {isAdmin && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              Invite a Member
            </h2>
            <InviteForm />
          </section>
        )}
      </div>
    </WorkspaceShell>
  );
}
