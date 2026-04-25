import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import HouseholdMemberCard from "@/components/layout/household-member-card";
import { getUserFirstName } from "@/lib/auth/get-user-first-name";
import InvestmentAccountForm from "@/components/investment-accounts/investment-account-form";
import InvestmentAccountsTable from "@/components/investment-accounts/investment-accounts-table";

export type InvestmentAccountRow = {
  id: string;
  name: string;
  account_subtype: string;
  opening_balance: number | null;
  interest_rate: number | null;
  target_amount: number | null;
  target_date: string | null;
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
    .from("accounts")
    .select("id, name, account_subtype, opening_balance, interest_rate, target_amount, target_date")
    .eq("tenant_id", membership.tenant_id)
    .eq("account_kind", "investment")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load investment accounts: ${error.message}`);
  }

  const toNum = (v: unknown): number | null =>
    v == null ? null : typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : null;

  const rows: InvestmentAccountRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    account_subtype: String(row.account_subtype ?? ""),
    opening_balance: toNum(row.opening_balance),
    interest_rate: toNum(row.interest_rate),
    target_amount: toNum(row.target_amount),
    target_date: row.target_date ? String(row.target_date) : null,
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
      title="Investments"
      description="Manage investment accounts with type, balance, and interest rate."
      leftPanelSections={leftPanelSections}
    >
      <div className="space-y-3">
        <InvestmentAccountForm />
        <InvestmentAccountsTable rows={rows} />
      </div>
    </WorkspaceShell>
  );
}
