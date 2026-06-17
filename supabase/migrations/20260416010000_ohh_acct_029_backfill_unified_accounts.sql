-- OHH-ACCT-029: Backfill legacy account rows into unified accounts table
-- Idempotent. Safe to re-run. No legacy tables altered. No application code changes.

create or replace function public.backfill_unified_accounts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  -- Savings accounts
  insert into public.accounts (
    id,
    tenant_id,
    account_kind,
    name,
    account_subtype,
    account_number_last4,
    target_amount,
    target_date,
    is_active,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    sa.tenant_id,
    'savings',
    sa.purpose,
    null,
    sa.account_number_last4,
    sa.target_amount,
    sa.target_date,
    true,
    sa.created_at,
    sa.updated_at
  from public.savings_accounts sa
  where not exists (
    select 1 from public.account_id_map m
    where m.source_table = 'savings_accounts'
      and m.source_account_id = sa.id
  );

  -- Populate account_id_map for savings
  insert into public.account_id_map (
    tenant_id,
    source_table,
    source_account_id,
    account_id
  )
  select
    sa.tenant_id,
    'savings_accounts',
    sa.id,
    a.id
  from public.savings_accounts sa
  join public.accounts a
    on a.tenant_id = sa.tenant_id
    and a.account_kind = 'savings'
    and a.name = sa.purpose
  where not exists (
    select 1 from public.account_id_map m
    where m.source_table = 'savings_accounts'
      and m.source_account_id = sa.id
  );

  -- Investment accounts
  insert into public.accounts (
    id,
    tenant_id,
    account_kind,
    name,
    account_subtype,
    account_number_last4,
    target_amount,
    target_date,
    is_active,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    ia.tenant_id,
    'investment',
    ia.name,
    ia.account_type,
    null,
    null,
    null,
    true,
    ia.created_at,
    ia.updated_at
  from public.investment_accounts ia
  where not exists (
    select 1 from public.account_id_map m
    where m.source_table = 'investment_accounts'
      and m.source_account_id = ia.id
  );

  -- Populate account_id_map for investments
  insert into public.account_id_map (
    tenant_id,
    source_table,
    source_account_id,
    account_id
  )
  select
    ia.tenant_id,
    'investment_accounts',
    ia.id,
    a.id
  from public.investment_accounts ia
  join public.accounts a
    on a.tenant_id = ia.tenant_id
    and a.account_kind = 'investment'
    and a.name = ia.name
  where not exists (
    select 1 from public.account_id_map m
    where m.source_table = 'investment_accounts'
      and m.source_account_id = ia.id
  );

  -- Debt accounts
  insert into public.accounts (
    id,
    tenant_id,
    account_kind,
    name,
    account_subtype,
    account_number_last4,
    target_amount,
    target_date,
    is_active,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    da.tenant_id,
    'debt',
    da.name,
    da.type,
    null,
    null,
    null,
    true,
    da.created_at,
    da.updated_at
  from public.debt_accounts da
  where not exists (
    select 1 from public.account_id_map m
    where m.source_table = 'debt_accounts'
      and m.source_account_id = da.id
  );

  -- Populate account_id_map for debts
  insert into public.account_id_map (
    tenant_id,
    source_table,
    source_account_id,
    account_id
  )
  select
    da.tenant_id,
    'debt_accounts',
    da.id,
    a.id
  from public.debt_accounts da
  join public.accounts a
    on a.tenant_id = da.tenant_id
    and a.account_kind = 'debt'
    and a.name = da.name
  where not exists (
    select 1 from public.account_id_map m
    where m.source_table = 'debt_accounts'
      and m.source_account_id = da.id
  );

end;
$$;

revoke all on function public.backfill_unified_accounts() from public;
grant execute on function public.backfill_unified_accounts() to authenticated;

select public.backfill_unified_accounts();
