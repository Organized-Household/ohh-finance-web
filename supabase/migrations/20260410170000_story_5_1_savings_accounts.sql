create table public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purpose text not null,
  account_number_last4 text null
    check (account_number_last4 is null or account_number_last4 ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index savings_accounts_tenant_id_idx
  on public.savings_accounts(tenant_id);

create unique index savings_accounts_tenant_lower_purpose_uniq
  on public.savings_accounts(tenant_id, lower(purpose));

alter table public.savings_accounts enable row level security;

create policy "savings_accounts_select_for_tenant_members"
on public.savings_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = savings_accounts.tenant_id
      and tm.user_id = auth.uid()
  )
);

create policy "savings_accounts_insert_for_tenant_admins"
on public.savings_accounts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = savings_accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

create policy "savings_accounts_update_for_tenant_admins"
on public.savings_accounts
for update
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = savings_accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = savings_accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

create policy "savings_accounts_delete_for_tenant_admins"
on public.savings_accounts
for delete
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = savings_accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);
