begin;

create table public.expense_types (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  slug       text        not null,
  is_active  boolean     not null default true,
  is_system  boolean     not null default false,
  sort_order int         not null default 0,
  created_at timestamptz not null default now()
);

-- Slug must be globally unique (expense_types are shared system-wide, not per-tenant)
create unique index expense_types_slug_uniq on public.expense_types (slug);

-- Seed the four standard values
insert into public.expense_types (name, slug, is_system, sort_order) values
  ('Standard',   'standard',   true,  1),
  ('Savings',    'savings',    true,  2),
  ('Investment', 'investment', true,  3),
  ('Charity',    'charity',    false, 4);

-- RLS: anyone authenticated can read expense_types (shared, not tenant-scoped)
alter table public.expense_types enable row level security;

create policy "expense_types_select_authenticated"
on public.expense_types for select to authenticated
using (true);

commit;
