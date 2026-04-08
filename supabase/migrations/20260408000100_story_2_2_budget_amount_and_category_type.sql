alter table categories
add column if not exists category_type text;

update categories
set category_type = 'expense'
where category_type is null;

alter table categories
alter column category_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_category_type_check'
  ) then
    alter table categories
    add constraint categories_category_type_check
    check (category_type in ('income', 'expense'));
  end if;
end $$;


alter table budget_lines
add column if not exists amount numeric(12,2);

update budget_lines
set amount = case
  when coalesce(planned_income, 0) > 0 then planned_income
  when coalesce(planned_expense, 0) > 0 then planned_expense
  else 0
end
where amount is null;

alter table budget_lines
alter column amount set not null;

alter table budget_lines
alter column amount set default 0;

alter table budget_lines
drop column if exists planned_income;

alter table budget_lines
drop column if exists planned_expense;