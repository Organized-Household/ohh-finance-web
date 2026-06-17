-- OHH-ACCT-034: Drop legacy account tables and transaction FK columns
-- Permanent cleanup. Irreversible.
-- Application code confirmed clean (zero grep results) before this migration.
-- Drops: savings_accounts, investment_accounts, debt_accounts, account_id_map
-- Drops: 6 legacy FK columns from transactions + their constraints and indexes

-- Block 2 — Drop legacy check constraints from transactions
alter table public.transactions
  drop constraint if exists transactions_only_one_account_link_chk,
  drop constraint if exists transactions_only_one_payment_source_chk,
  drop constraint if exists transactions_payment_source_not_same_as_destination_chk;

-- Block 3 — Drop legacy FK constraints from transactions
alter table public.transactions
  drop constraint if exists transactions_savings_account_id_fkey,
  drop constraint if exists transactions_investment_account_id_fkey,
  drop constraint if exists transactions_debt_account_id_fkey,
  drop constraint if exists transactions_payment_savings_account_id_fkey,
  drop constraint if exists transactions_payment_investment_account_id_fkey,
  drop constraint if exists transactions_payment_debt_account_id_fkey;

-- Block 4 — Drop legacy indexes on transactions
drop index if exists public.idx_transactions_savings_account_id;
drop index if exists public.idx_transactions_investment_account_id;
drop index if exists public.idx_transactions_debt_account_id;
drop index if exists public.idx_transactions_payment_savings_account_id;
drop index if exists public.idx_transactions_payment_investment_account_id;
drop index if exists public.idx_transactions_payment_debt_account_id;

-- Block 5 — Drop legacy FK columns from transactions
alter table public.transactions
  drop column if exists savings_account_id,
  drop column if exists investment_account_id,
  drop column if exists debt_account_id,
  drop column if exists payment_savings_account_id,
  drop column if exists payment_investment_account_id,
  drop column if exists payment_debt_account_id;

-- Block 6 — Drop savings_accounts
drop table if exists public.savings_accounts cascade;

-- Block 7 — Drop investment_accounts
drop table if exists public.investment_accounts cascade;

-- Block 8 — Drop debt_accounts
drop table if exists public.debt_accounts cascade;

-- Block 9 — Drop account_id_map
drop table if exists public.account_id_map cascade;

-- Block 10 — Drop backfill functions
drop function if exists public.backfill_unified_accounts();
drop function if exists public.backfill_transaction_account_links();
