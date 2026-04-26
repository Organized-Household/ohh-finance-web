begin;

-- Allow admins to read all profiles for members of their tenant.
-- Members can still only read their own profile (existing profiles_select_self
-- policy is unchanged — this policy is purely additive).
create policy profiles_select_tenant_admin
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members admin_tm
    join public.tenant_members member_tm
      on member_tm.tenant_id = admin_tm.tenant_id
    where admin_tm.user_id  = auth.uid()
      and admin_tm.role     = 'admin'
      and member_tm.user_id = profiles.user_id
  )
);

commit;
