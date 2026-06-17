begin;

-- Step 1: Drop the hardcoded check constraint
alter table public.categories
  drop constraint if exists categories_tag_check;

-- Step 2: Add foreign key reference to expense_types.slug
-- FK on text slug (not uuid) — keeps categories.tag readable in queries
alter table public.categories
  add constraint categories_tag_fk
  foreign key (tag)
  references public.expense_types (slug)
  on update cascade   -- if slug is renamed, categories update automatically
  on delete restrict; -- cannot delete an expense_type that has categories using it

commit;
