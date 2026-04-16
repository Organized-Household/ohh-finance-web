-- OHH-ACCT-028: Unified accounts table foundation
-- Schema-only. No legacy tables altered. No backfill. No application code changes.

-- Block 1 — Create accounts table
create table public.accounts (
  id                    uuid          not null default gen_random_uuid() primary key,
  tenant_id             uuid          not null references public.tenants(id) on delete cascade,
  account_kind          text          not null check (account_kind in ('savings', 'investment', 'debt')),
  name                  text          not null,
  account_subtype       text          null,
  account_number_last4  text          null check (account_number_last4 ~ '^[0-9]{4}$'),
  target_amount         numeric(12,2) null,
  target_date           date          null,
  is_active             boolean       not null default true,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

-- Block 2 — Uniqueness constraint
create unique index accounts_tenant_kind_name_uidx
  on public.accounts (tenant_id, account_kind, lower(name));

-- Block 3 — Performance indexes
create index accounts_tenant_id_idx
  on public.accounts (tenant_id);

create index accounts_tenant_kind_idx
  on public.accounts (tenant_id, account_kind);

create index accounts_tenant_kind_active_idx
  on public.accounts (tenant_id, account_kind, is_active);

-- Block 4 — Enable RLS
alter table public.accounts enable row level security;

-- Block 5 — RLS policies on accounts
create policy "accounts_select_for_tenant_members"
on public.accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = accounts.tenant_id
      and tm.user_id = auth.uid()
  )
);

create policy "accounts_insert_for_tenant_admins"
on public.accounts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

create policy "accounts_update_for_tenant_admins"
on public.accounts
for update
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

create policy "accounts_delete_for_tenant_admins"
on public.accounts
for delete
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = accounts.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

-- Block 6 — Create account_id_map table
create table public.account_id_map (
  id                uuid        not null default gen_random_uuid() primary key,
  tenant_id         uuid        not null references public.tenants(id) on delete cascade,
  source_table      text        not null check (source_table in ('savings_accounts', 'investment_accounts', 'debt_accounts')),
  source_account_id uuid        not null,
  account_id        uuid        not null references public.accounts(id) on delete cascade,
  created_at        timestamptz not null default now()
);

-- Block 7 — account_id_map constraints and indexes
create unique index account_id_map_source_uidx
  on public.account_id_map (source_table, source_account_id);

create unique index account_id_map_account_id_uidx
  on public.account_id_map (account_id);

create index account_id_map_tenant_idx
  on public.account_id_map (tenant_id);

-- Block 8 — Enable RLS on account_id_map
alter table public.account_id_map enable row level security;

-- Block 9 — RLS policies on account_id_map
create policy "account_id_map_select_for_tenant_members"
on public.account_id_map
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = account_id_map.tenant_id
      and tm.user_id = auth.uid()
  )
);

create policy "account_id_map_insert_for_tenant_admins"
on public.account_id_map
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = account_id_map.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);

create policy "account_id_map_delete_for_tenant_admins"
on public.account_id_map
for delete
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = account_id_map.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  )
);
