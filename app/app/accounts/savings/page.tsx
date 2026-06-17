import WorkspaceShell from "@/components/layout/workspace-shell";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import SavingsAccountForm from "@/components/savings-accounts/savings-account-form";
import SavingsAccountsTable from "@/components/savings-accounts/savings-accounts-table";
import MemberSelectorCard from "@/components/layout/MemberSelectorCard";

export type SavingsAccountRow = {
  id: string;
  name: string;
  account_number_last4: string | null;
  opening_balance: number | null;
  interest_rate: number | null;
  target_amount: number | null;
  target_date: string | null;
};

type SearchParams = Promise<{ member?: string }>;

export default async function SavingsAccountsPage({
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
    .select("id, name, account_number_last4, opening_balance, interest_rate, target_amount, target_date")
    .eq("tenant_id", membership.tenant_id)
    .eq("user_id", activeMemberId)
    .eq("account_kind", "savings")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load savings accounts: ${error.message}`);
  }

  const toNum = (v: unknown): number | null =>
    v == null ? null : typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : null;

  const rows: SavingsAccountRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    account_number_last4: row.account_number_last4 ? String(row.account_number_last4) : null,
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
          Savings accounts belong to individual members. New accounts are always
          created for the logged-in user.
        </p>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="Savings"
      description="Manage savings accounts with balance, rate, and savings targets."
      leftPanelSections={leftPanelSections}
      isAdmin={isAdmin}
      currentUserId={user.id}
      activeMemberId={activeMemberId}
    >
      <div className="space-y-3">
        <SavingsAccountForm />
        <SavingsAccountsTable rows={rows} />
      </div>
    </WorkspaceShell>
  );
}
