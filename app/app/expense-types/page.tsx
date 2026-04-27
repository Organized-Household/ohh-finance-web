import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WorkspaceShell from "@/components/layout/workspace-shell";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import ExpenseTypesClient from "./expense-types-client";

export default async function ExpenseTypesPage() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authenticated user not found");
  }

  const membership = await getCurrentTenantMembership();
  const isAdmin = membership.role === "admin";

  const [
    { data: expenseTypes, error: etError },
    { data: tenantData },
    { count: activeMemberCount },
  ] = await Promise.all([
    supabase
      .from("expense_types")
      .select("id, name, slug, is_active, is_system, sort_order")
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("tenants")
      .select("name")
      .eq("id", membership.tenant_id)
      .single(),
    supabaseAdmin
      .from("tenant_members")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", membership.tenant_id)
      .eq("is_active", true),
  ]);

  if (etError) {
    throw new Error(`Failed to load expense types: ${etError.message}`);
  }

  const tenantName = tenantData?.name ?? "Your Household";
  const memberCount = activeMemberCount ?? 1;

  const leftPanelSections = [
    {
      title: "Household",
      content: (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Household
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">{tenantName}</p>
          <p className="mt-1.5 text-xs text-slate-500">
            Expense types are shared by {memberCount}{" "}
            {memberCount === 1 ? "member" : "members"}.
          </p>
        </div>
      ),
    },
  ];

  return (
    <WorkspaceShell
      title="Expense Types"
      description="Expense types are shared across your household. Use them to group budget categories by purpose (e.g. Standard, Savings, Charity)."
      leftPanelSections={leftPanelSections}
      isAdmin={isAdmin}
      currentUserId={user.id}
      activeMemberId={user.id}
    >
      <ExpenseTypesClient expenseTypes={expenseTypes ?? []} />
    </WorkspaceShell>
  );
}
