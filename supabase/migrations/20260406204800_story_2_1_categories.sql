create table public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  tag text not null default 'standard'
    check (tag in ('standard', 'savings', 'investment')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index categories_tenant_lower_name_uniq
  on public.categories (tenant_id, lower(name));

alter table public.categories enable row level security;

create policy "categories_select_for_tenant_members"
on public.categories
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id = auth.uid()
  )
);

create policy "categories_insert_for_tenant_admins"
on public.categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

create policy "categories_update_for_tenant_admins"
on public.categories
for update
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

create policy "categories_delete_for_tenant_admins"
on public.categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);