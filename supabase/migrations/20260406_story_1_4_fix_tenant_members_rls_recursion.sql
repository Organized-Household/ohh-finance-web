begin;

drop policy if exists tenant_members_select_member on public.tenant_members;

create policy tenant_members_select_self
on public.tenant_members
for select
to authenticated
using (user_id = auth.uid());

commit;