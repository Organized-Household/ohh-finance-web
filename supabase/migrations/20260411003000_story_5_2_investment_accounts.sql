create table public.investment_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  account_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index investment_accounts_tenant_id_idx
  on public.investment_accounts(tenant_id);

create unique index investment_accounts_tenant_lower_name_type_uniq
  on public.investment_accounts(tenant_id, lower(name), lower(account_type));

alter table public.investment_accounts enable row level security;

create policy "investment_accounts_select_for_tenant_members"
on public.investment_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = investment_accounts.tenant_id
      and tm.user_id = auth.uid()
  )
);

create policy "investment_accounts_insert_for_tenant_admins"
on public.investment_accounts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = investment_accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

create policy "investment_accounts_update_for_tenant_admins"
on public.investment_accounts
for update
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = investment_accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = investment_accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

create policy "investment_accounts_delete_for_tenant_admins"
on public.investment_accounts
for delete
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = investment_accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);
