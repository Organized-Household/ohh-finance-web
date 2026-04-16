alter table public.transactions
  add column savings_account_id uuid null references public.savings_accounts(id) on delete set null,
  add column investment_account_id uuid null references public.investment_accounts(id) on delete set null,
  add column debt_account_id uuid null references public.debt_accounts(id) on delete set null;

create index idx_transactions_savings_account_id
  on public.transactions(savings_account_id);

create index idx_transactions_investment_account_id
  on public.transactions(investment_account_id);

create index idx_transactions_debt_account_id
  on public.transactions(debt_account_id);

alter table public.transactions
  add constraint transactions_only_one_account_link_chk
  check (
    (case when savings_account_id is not null then 1 else 0 end) +
    (case when investment_account_id is not null then 1 else 0 end) +
    (case when debt_account_id is not null then 1 else 0 end)
    <= 1
  );
