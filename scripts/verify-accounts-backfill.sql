-- OHH-ACCT-029: Backfill verification script
-- Run in Supabase SQL editor. Read-only. No data changes.

-- 1. Legacy table counts
select 'savings_accounts'    as source, count(*) as row_count from public.savings_accounts
union all
select 'investment_accounts' as source, count(*) as row_count from public.investment_accounts
union all
select 'debt_accounts'       as source, count(*) as row_count from public.debt_accounts;

-- 2. Unified accounts counts by kind
select account_kind, count(*) as row_count
from public.accounts
group by account_kind
order by account_kind;

-- 3. account_id_map counts by source
select source_table, count(*) as mapped_rows
from public.account_id_map
group by source_table
order by source_table;

-- 4. Unmapped legacy rows (should return zero rows after backfill)
select 'savings_accounts' as source, id as unmapped_id
from public.savings_accounts
where id not in (
  select source_account_id from public.account_id_map
  where source_table = 'savings_accounts'
)
union all
select 'investment_accounts', id
from public.investment_accounts
where id not in (
  select source_account_id from public.account_id_map
  where source_table = 'investment_accounts'
)
union all
select 'debt_accounts', id
from public.debt_accounts
where id not in (
  select source_account_id from public.account_id_map
  where source_table = 'debt_accounts'
);

-- 5. Tenant integrity check (should return zero rows)
-- Flags any account_id_map row where accounts.tenant_id != source tenant_id
select m.source_table, m.source_account_id, m.tenant_id as map_tenant, a.tenant_id as account_tenant
from public.account_id_map m
join public.accounts a on a.id = m.account_id
where m.tenant_id != a.tenant_id;

-- 6. Duplicate mapping check (should return zero rows)
select source_table, source_account_id, count(*) as mapping_count
from public.account_id_map
group by source_table, source_account_id
having count(*) > 1;
