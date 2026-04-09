create table public.transactions (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  created_by_user_id uuid not null
    references auth.users(id)
    on delete cascade,

  category_id uuid not null
    references public.categories(id)
    on delete restrict,

  description text not null,

  amount numeric(12,2) not null
    check (amount >= 0),

  transaction_date date not null,

  transaction_type text not null
    check (transaction_type in ('income', 'expense')),

  created_at timestamptz not null default now()
);

create index transactions_tenant_id_idx
on public.transactions(tenant_id);

create index transactions_category_id_idx
on public.transactions(category_id);

create index transactions_transaction_date_idx
on public.transactions(transaction_date);

alter table public.transactions enable row level security;

create policy "transactions_select_for_tenant_members"
on public.transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = transactions.tenant_id
      and tm.user_id = auth.uid()
  )
);

create policy "transactions_insert_for_tenant_members"
on public.transactions
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = transactions.tenant_id
      and tm.user_id = auth.uid()
  )
);
