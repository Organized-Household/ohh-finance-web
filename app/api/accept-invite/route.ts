import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  // Service role required: reads invitations before invitee has RLS access.
  // Invitee's session has no tenant_members row yet, so RLS blocks read.
  const adminClient = createAdminClient();

  const { data: invitation, error: inviteError } = await adminClient
    .from('invitations')
    .select('*, tenants(*)')
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (inviteError || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { error: memberError } = await adminClient
    .from('tenant_members')
    .insert({
      tenant_id: invitation.tenant_id,
      user_id: user.id,
      role: invitation.role,
    });

  if (memberError) {
    return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
  }

  const { error: updateError } = await adminClient
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update invitation status' }, { status: 500 });
  }

  return NextResponse.json({ success: true, tenant: invitation.tenants });
}
