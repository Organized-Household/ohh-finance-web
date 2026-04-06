begin;

-- Enable RLS on tenant-scoped and user-scoped tables
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.profiles enable row level security;

-- Recreate policies deterministically
drop policy if exists tenants_select_member on public.tenants;

drop policy if exists tenant_members_select_member on public.tenant_members;

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;

-- tenants: authenticated users can only read tenants they belong to
create policy tenants_select_member
on public.tenants
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = tenants.id
      and tm.user_id = auth.uid()
  )
);

-- tenant_members: authenticated users can only read memberships
-- for tenants they belong to
create policy tenant_members_select_member
on public.tenant_members
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = tenant_members.tenant_id
      and tm.user_id = auth.uid()
  )
);

-- profiles: users can only access their own profile row
create policy profiles_select_self
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Harden RPC used for tenant bootstrap
create or replace function public.create_tenant_and_membership(
  p_alias text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_user_id is distinct from auth.uid() then
    raise exception 'Cannot create tenant for another user';
  end if;

  insert into public.tenants (alias)
  values (p_alias)
  returning id into v_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (v_tenant_id, p_user_id, 'admin');

  return v_tenant_id;
end;
$$;

revoke all on function public.create_tenant_and_membership(text, uuid) from public;
grant execute on function public.create_tenant_and_membership(text, uuid) to authenticated;

commit;