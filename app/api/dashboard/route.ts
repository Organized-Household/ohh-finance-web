import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const membership = await getCurrentTenantMembership(supabase);

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month');

    if (!monthParam) {
      return NextResponse.json(
        { error: 'month parameter required (YYYY-MM-01)' },
        { status: 400 }
      );
    }

    const monthStart = new Date(monthParam);
    if (isNaN(monthStart.getTime())) {
      return NextResponse.json(
        { error: 'Invalid month format' },
        { status: 400 }
      );
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: dashboardData, error: rpcError } = await supabase.rpc(
      'rpc_dashboard_summary',
      {
        p_month_start: monthParam,
        p_user_id: user.user.id
      }
    );

    if (rpcError) {
      console.error('Dashboard RPC error:', rpcError);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: dashboardData });
  } catch (err: unknown) {
    console.error('Dashboard route error:', err);
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
