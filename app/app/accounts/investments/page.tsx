import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import MemberSelectorCard from "@/components/layout/MemberSelectorCard";
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

type SearchParams = Promise<{ member?: string }>;

export default async function InvestmentAccountsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const membership = await getCurrentTenantMembership();
  const isAdmin = membership.role === "admin";
  // Server enforces: members always see own data regardless of URL param
  const activeMemberId = isAdmin ? (params.member ?? user.id) : user.id;

  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, account_subtype, opening_balance, interest_rate, target_amount, target_date")
    .eq("tenant_id", membership.tenant_id)
    .eq("user_id", activeMemberId)
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
      content: (
        <MemberSelectorCard
          isAdmin={isAdmin}
          currentUserId={user.id}
          activeMemberId={activeMemberId}
        />
      ),
    },
    {
      title: "Account Scope",
      content: (
        <p className="text-xs text-slate-600">
          Investment accounts belong to individual members. New accounts are
          always created for the logged-in user.
        </p>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="Investments"
      description="Manage investment accounts with type, balance, and interest rate."
      leftPanelSections={leftPanelSections}
      isAdmin={isAdmin}
      currentUserId={user.id}
      activeMemberId={activeMemberId}
    >
      <div className="space-y-3">
        <InvestmentAccountForm />
        <InvestmentAccountsTable rows={rows} />
      </div>
    </WorkspaceShell>
  );
}
