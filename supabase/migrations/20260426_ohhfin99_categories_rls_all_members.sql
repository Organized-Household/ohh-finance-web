begin;

-- Drop admin-only insert/update/delete policies
drop policy if exists "categories_insert_for_tenant_admins" on public.categories;
drop policy if exists "categories_update_for_tenant_admins" on public.categories;
drop policy if exists "categories_delete_for_tenant_admins" on public.categories;

-- Allow any active tenant member to insert categories
create policy "categories_insert_for_tenant_members"
on public.categories for insert to authenticated
with check (
  exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id   = auth.uid()
      and tm.is_active = true
  )
);

-- Allow any active tenant member to update categories
create policy "categories_update_for_tenant_members"
on public.categories for update to authenticated
using (
  exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id   = auth.uid()
      and tm.is_active = true
  )
)
with check (
  exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id   = auth.uid()
      and tm.is_active = true
  )
);

-- Allow any active tenant member to delete categories
create policy "categories_delete_for_tenant_members"
on public.categories for delete to authenticated
using (
  exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id   = auth.uid()
      and tm.is_active = true
  )
);

commit;
