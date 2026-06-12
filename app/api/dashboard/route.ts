import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const membership = await getCurrentTenantMembership()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json({ error: 'Month parameter required' }, { status: 400 })
    }

    const monthStart = new Date(month)
    if (isNaN(monthStart.getTime())) {
      return NextResponse.json({ error: 'Invalid month format' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('rpc_dashboard_summary', {
      p_month_start: monthStart.toISOString().split('T')[0],
      p_user_id: userData.user.id,
    })

    if (error) {
      console.error('Dashboard RPC error:', error)
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
