alter table public.savings_accounts
  add column if not exists target_amount numeric(12,2) null,
  add column if not exists target_date date null;
