-- OHH-ACCT-031: Add unified transaction linkage columns
-- Adds linked_account_id and payment_source_account_id to transactions.
-- Backfills from legacy FK columns via account_id_map.
-- Legacy columns untouched. No application code changes.

-- Block 2 — Add new columns
alter table public.transactions
  add column if not exists linked_account_id uuid null
    references public.accounts(id) on delete set null,
  add column if not exists payment_source_account_id uuid null
    references public.accounts(id) on delete set null;

-- Block 3 — Add indexes
create index if not exists idx_transactions_linked_account_id
  on public.transactions(linked_account_id);

create index if not exists idx_transactions_payment_source_account_id
  on public.transactions(payment_source_account_id);

-- Block 4 — Add check constraint
alter table public.transactions
  add constraint transactions_linked_not_same_as_payment_source_chk
  check (
    linked_account_id is null
    or payment_source_account_id is null
    or linked_account_id <> payment_source_account_id
  );

-- Block 5 — Backfill function
create or replace function public.backfill_transaction_account_links()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  -- Backfill linked_account_id from legacy destination columns
  update public.transactions t
  set linked_account_id = m.account_id
  from public.account_id_map m
  where t.linked_account_id is null
    and (
      (t.savings_account_id is not null
        and m.source_table = 'savings_accounts'
        and m.source_account_id = t.savings_account_id)
      or
      (t.investment_account_id is not null
        and m.source_table = 'investment_accounts'
        and m.source_account_id = t.investment_account_id)
      or
      (t.debt_account_id is not null
        and m.source_table = 'debt_accounts'
        and m.source_account_id = t.debt_account_id)
    );

  -- Backfill payment_source_account_id from legacy payment source columns
  update public.transactions t
  set payment_source_account_id = m.account_id
  from public.account_id_map m
  where t.payment_source_account_id is null
    and (
      (t.payment_savings_account_id is not null
        and m.source_table = 'savings_accounts'
        and m.source_account_id = t.payment_savings_account_id)
      or
      (t.payment_investment_account_id is not null
        and m.source_table = 'investment_accounts'
        and m.source_account_id = t.payment_investment_account_id)
      or
      (t.payment_debt_account_id is not null
        and m.source_table = 'debt_accounts'
        and m.source_account_id = t.payment_debt_account_id)
    );

end;
$$;

revoke all on function public.backfill_transaction_account_links() from public;
grant execute on function public.backfill_transaction_account_links() to authenticated;

-- Block 6 — Execute the backfill
select public.backfill_transaction_account_links();
