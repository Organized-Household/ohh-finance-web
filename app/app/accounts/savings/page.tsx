import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import SavingsAccountForm from "@/components/savings-accounts/savings-account-form";
import SavingsAccountsTable from "@/components/savings-accounts/savings-accounts-table";
import HouseholdMemberCard from "@/components/layout/household-member-card";
import { getUserFirstName } from "@/lib/auth/get-user-first-name";

type SavingsAccountRow = {
  id: string;
  purpose: string;
  account_number_last4: string | null;
};

export default async function SavingsAccountsPage() {
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
    .from("savings_accounts")
    .select("id, purpose, account_number_last4")
    .eq("tenant_id", membership.tenant_id)
    .order("purpose", { ascending: true });

  if (error) {
    throw new Error(`Failed to load savings accounts: ${error.message}`);
  }

  const rows: SavingsAccountRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    purpose: String(row.purpose),
    account_number_last4: row.account_number_last4
      ? String(row.account_number_last4)
      : null,
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
          Savings accounts are tenant-scoped and visible only within your
          household workspace.
        </p>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="Savings Accounts"
      description="Manage tenant savings accounts with optional account number reference."
      leftPanelSections={leftPanelSections}
      topbarControls={
        <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Tenant-scoped account management
        </div>
      }
    >
      <div className="space-y-3">
        <SavingsAccountForm />
        <SavingsAccountsTable rows={rows} />
      </div>
    </WorkspaceShell>
  );
}
