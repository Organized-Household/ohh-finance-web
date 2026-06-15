import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership'
import { WorkspaceShell } from '@/components/layout/workspace-shell'
import { CategoriesList } from '@/components/budgets/categories-list'

export default async function BudgetCategoriesPage() {
  const membership = await getCurrentTenantMembership()
  if (!membership) {
    return <div>Unauthorized</div>
  }

  const adminClient = createAdminClient()
  const anonClient = await createClient()

  // Service role required: tenants table has no RLS SELECT policy allowing members to read their own tenant row
  const { data: tenant } = await adminClient
    .from('tenants')
    .select('name')
    .eq('id', membership.tenant_id)
    .single()

  // Anon client sufficient: RLS SELECT policy allows authenticated users to read tenant_members within their tenant
  const { count: memberCount } = await anonClient
    .from('tenant_members')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', membership.tenant_id)
    .eq('is_active', true)

  const { data: categories } = await adminClient
    .from('categories')
    .select('*, expense_types(slug, name)')
    .eq('tenant_id', membership.tenant_id)
    .order('name')

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget Categories</h1>
            <p className="text-muted-foreground">
              {tenant?.name} • {memberCount} member{memberCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/app/budgets/categories/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoriesList categories={categories || []} />
          </CardContent>
        </Card>
      </div>
    </WorkspaceShell>
  )
}
