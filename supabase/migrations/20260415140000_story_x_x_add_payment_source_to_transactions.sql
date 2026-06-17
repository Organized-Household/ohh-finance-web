alter table public.transactions
  add column payment_savings_account_id uuid null references public.savings_accounts(id) on delete set null,
  add column payment_investment_account_id uuid null references public.investment_accounts(id) on delete set null,
  add column payment_debt_account_id uuid null references public.debt_accounts(id) on delete set null;

create index idx_transactions_payment_savings_account_id
  on public.transactions(payment_savings_account_id);

create index idx_transactions_payment_investment_account_id
  on public.transactions(payment_investment_account_id);

create index idx_transactions_payment_debt_account_id
  on public.transactions(payment_debt_account_id);

alter table public.transactions
  add constraint transactions_only_one_payment_source_chk
  check (
    (case when payment_savings_account_id is not null then 1 else 0 end) +
    (case when payment_investment_account_id is not null then 1 else 0 end) +
    (case when payment_debt_account_id is not null then 1 else 0 end)
    <= 1
  );

alter table public.transactions
  add constraint transactions_payment_source_not_same_as_destination_chk
  check (
    (
      payment_savings_account_id is null or
      savings_account_id is null or
      payment_savings_account_id <> savings_account_id
    ) and (
      payment_investment_account_id is null or
      investment_account_id is null or
      payment_investment_account_id <> investment_account_id
    ) and (
      payment_debt_account_id is null or
      debt_account_id is null or
      payment_debt_account_id <> debt_account_id
    )
  );
