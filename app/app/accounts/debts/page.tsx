import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import HouseholdMemberCard from "@/components/layout/household-member-card";
import { getUserFirstName } from "@/lib/auth/get-user-first-name";
import DebtAccountForm from "@/components/debt-accounts/debt-account-form";
import DebtAccountsTable from "@/components/debt-accounts/debt-accounts-table";

type DebtAccountRow = {
  id: string;
  name: string;
  type: string;
};

export default async function DebtAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const memberFirstName = getUserFirstName(user);
  const membership = await getCurrentTenantMembership();

  const { data, error } = await supabase
    .from("debt_accounts")
    .select("id, name, type")
    .eq("tenant_id", membership.tenant_id)
    .order("name", { ascending: true })
    .order("type", { ascending: true });

  if (error) {
    throw new Error(`Failed to load debt accounts: ${error.message}`);
  }

  const rows: DebtAccountRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
  }));

  const leftPanelSections: WorkspaceLeftPanelSection[] = [
    {
      title: "Household Member",
      content: <HouseholdMemberCard firstName={memberFirstName} />,
    },
    {
      title: "Account Scope",
      content: (
        <p className="text-xs text-slate-600">
          Debt accounts are tenant-scoped and visible only within your
          household workspace.
        </p>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="Debt Accounts"
      description="Manage tenant debt accounts with name and type."
      leftPanelSections={leftPanelSections}
      topbarControls={
        <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Tenant-scoped account management
        </div>
      }
    >
      <div className="space-y-3">
        <DebtAccountForm />
        <DebtAccountsTable rows={rows} />
      </div>
    </WorkspaceShell>
  );
}
