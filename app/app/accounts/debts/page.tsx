import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import MemberSelectorCard from "@/components/layout/MemberSelectorCard";
import DebtAccountForm from "@/components/debt-accounts/debt-account-form";
import DebtAccountsTable from "@/components/debt-accounts/debt-accounts-table";

export type DebtAccountRow = {
  id: string;
  name: string;
  account_subtype: string;
  opening_balance: number | null;
  interest_rate: number | null;
  target_amount: number | null;
  target_date: string | null;
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

  const membership = await getCurrentTenantMembership();

  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, account_subtype, opening_balance, interest_rate, target_amount, target_date")
    .eq("tenant_id", membership.tenant_id)
    .eq("account_kind", "debt")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load debt accounts: ${error.message}`);
  }

  const toNum = (v: unknown): number | null =>
    v == null ? null : typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : null;

  const rows: DebtAccountRow[] = (data ?? []).map((row) => ({
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
      content: <MemberSelectorCard />,
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
      title="Debts"
      description="Manage debt accounts with type, balance owed, and interest rate."
      leftPanelSections={leftPanelSections}
    >
      <div className="space-y-3">
        <DebtAccountForm />
        <DebtAccountsTable rows={rows} />
      </div>
    </WorkspaceShell>
  );
}
