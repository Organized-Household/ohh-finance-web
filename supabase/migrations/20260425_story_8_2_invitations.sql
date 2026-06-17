begin;

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  email       text not null,
  role        text not null default 'member'
                check (role in ('admin', 'member')),
  status      text not null default 'pending'
                check (status in ('pending', 'accepted', 'revoked')),
  invited_by  uuid not null references auth.users(id),
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz null,
  -- Prevent duplicate pending invites for same email in same tenant
  constraint invitations_tenant_email_pending_uniq
    unique (tenant_id, email, status)
);

alter table public.invitations enable row level security;

-- Tenant admins can read all invitations for their tenant
create policy "invitations_select_admin"
on public.invitations for select to authenticated
using (
  exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = invitations.tenant_id
      and tm.user_id   = auth.uid()
      and tm.role      = 'admin'
  )
);

-- Tenant admins can insert invitations
create policy "invitations_insert_admin"
on public.invitations for insert to authenticated
with check (
  exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = invitations.tenant_id
      and tm.user_id   = auth.uid()
      and tm.role      = 'admin'
  )
);

-- Tenant admins can update (revoke) invitations
create policy "invitations_update_admin"
on public.invitations for update to authenticated
using (
  exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = invitations.tenant_id
      and tm.user_id   = auth.uid()
      and tm.role      = 'admin'
  )
);

commit;
