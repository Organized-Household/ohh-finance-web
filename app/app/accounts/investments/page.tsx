import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import HouseholdMemberCard from "@/components/layout/household-member-card";
import { getUserFirstName } from "@/lib/auth/get-user-first-name";
import InvestmentAccountForm from "@/components/investment-accounts/investment-account-form";
import InvestmentAccountsTable from "@/components/investment-accounts/investment-accounts-table";

type InvestmentAccountRow = {
  id: string;
  name: string;
  account_type: string;
};

export default async function InvestmentAccountsPage() {
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
    .from("investment_accounts")
    .select("id, name, account_type")
    .eq("tenant_id", membership.tenant_id)
    .order("name", { ascending: true })
    .order("account_type", { ascending: true });

  if (error) {
    throw new Error(`Failed to load investment accounts: ${error.message}`);
  }

  const rows: InvestmentAccountRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    account_type: String(row.account_type),
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
          Investment accounts are tenant-scoped and visible only within your
          household workspace.
        </p>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="Investment Accounts"
      description="Manage tenant investment accounts with name and type."
      leftPanelSections={leftPanelSections}
      topbarControls={
        <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Tenant-scoped account management
        </div>
      }
    >
      <div className="space-y-3">
        <InvestmentAccountForm />
        <InvestmentAccountsTable rows={rows} />
      </div>
    </WorkspaceShell>
  );
}
