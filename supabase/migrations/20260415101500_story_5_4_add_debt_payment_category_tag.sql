alter table public.categories
  drop constraint if exists categories_tag_check;

alter table public.categories
  add constraint categories_tag_check
  check (tag in ('standard', 'savings', 'investment', 'debt_payment'));
