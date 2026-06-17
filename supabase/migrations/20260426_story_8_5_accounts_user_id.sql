begin;

-- Add user_id to accounts table
alter table public.accounts
  add column if not exists user_id uuid null
    references auth.users(id) on delete set null;

-- Backfill existing accounts to the tenant's first admin member
update public.accounts a
set user_id = (
  select tm.user_id
  from public.tenant_members tm
  where tm.tenant_id = a.tenant_id
    and tm.role = 'admin'
    and tm.is_active = true
  order by tm.created_at asc
  limit 1
)
where a.user_id is null;

-- Make user_id NOT NULL after backfill
alter table public.accounts
  alter column user_id set not null;

-- Index for member-scoped account queries
create index if not exists idx_accounts_user_id
  on public.accounts (tenant_id, user_id, is_active);

commit;
