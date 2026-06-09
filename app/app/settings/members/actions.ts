import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership';
import { revalidatePath } from 'next/cache';

export async function inviteMember(email: string, role: 'admin' | 'member') {
  const supabase = createClient();
  const membership = await getCurrentTenantMembership();

  if (!membership || membership.role !== 'admin') {
    return { error: 'Admin permission required' };
  }

  // Service role required: auth.admin.inviteUserByEmail requires admin client.
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email);

  if (error || !data.user) {
    return { error: error?.message || 'Invitation failed' };
  }

  const token = crypto.randomUUID();

  const { error: inviteError } = await adminClient
    .from('invitations')
    .insert({
      tenant_id: membership.tenant_id,
      email,
      role,
      token,
      status: 'pending',
    });

  if (inviteError) {
    return { error: 'Failed to create invitation record' };
  }

  revalidatePath('/app/settings/members');
  return { success: true };
}

export async function revokeInvitation(invitationId: string) {
  const membership = await getCurrentTenantMembership();

  if (!membership || membership.role !== 'admin') {
    return { error: 'Admin permission required' };
  }

  // Service role required: anon UPDATE RLS would silently block.
  // invitations table RLS allows UPDATE only by service role or owner.
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)
    .eq('tenant_id', membership.tenant_id);

  if (error) {
    return { error: 'Failed to revoke invitation' };
  }

  revalidatePath('/app/settings/members');
  return { success: true };
}

export async function updateMemberRole(
  userId: string,
  newRole: 'admin' | 'member'
) {
  const membership = await getCurrentTenantMembership();

  if (!membership || membership.role !== 'admin') {
    return { error: 'Admin permission required' };
  }

  // Service role required: tenant_members UPDATE requires admin client.
  // RLS policy restricts role changes to service role only.
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('tenant_members')
    .update({ role: newRole })
    .eq('user_id', userId)
    .eq('tenant_id', membership.tenant_id);

  if (error) {
    return { error: 'Failed to update member role' };
  }

  revalidatePath('/app/settings/members');
  return { success: true };
}

export async function removeMember(userId: string) {
  const membership = await getCurrentTenantMembership();

  if (!membership || membership.role !== 'admin') {
    return { error: 'Admin permission required' };
  }

  // Service role required: hard-delete requires admin client.
  // RLS policy restricts DELETE to service role only.
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('tenant_members')
    .delete()
    .eq('user_id', userId)
    .eq('tenant_id', membership.tenant_id);

  if (error) {
    return { error: 'Failed to remove member' };
  }

  revalidatePath('/app/settings/members');
  return { success: true };
}
