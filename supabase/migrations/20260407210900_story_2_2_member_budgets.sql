create table budgets (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references tenants(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    month_start date not null,

    created_at timestamptz not null
        default now(),

    unique (tenant_id, user_id, month_start)
);


create table budget_lines (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references tenants(id)
        on delete cascade,

    budget_id uuid not null
        references budgets(id)
        on delete cascade,

    category_id uuid not null
        references categories(id)
        on delete restrict,

    planned_income numeric(12,2) not null default 0,

    planned_expense numeric(12,2) not null default 0,

    created_at timestamptz not null
        default now(),

    unique (tenant_id, budget_id, category_id)
);


create index idx_budgets_lookup
on budgets (tenant_id, user_id, month_start);


create index idx_budget_lines_budget
on budget_lines (budget_id);


alter table budgets enable row level security;
alter table budget_lines enable row level security;


create policy "select own or admin budgets"
on budgets
for select
using (

    user_id = auth.uid()

    OR

    exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = budgets.tenant_id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )

);


create policy "insert own budgets"
on budgets
for insert
with check (
    user_id = auth.uid()
);


create policy "update own or admin budgets"
on budgets
for update
using (

    user_id = auth.uid()

    OR

    exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = budgets.tenant_id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )

);


create policy "select lines via parent budget"
on budget_lines
for select
using (

    exists (
        select 1
        from budgets b
        where b.id = budget_lines.budget_id

        and (

            b.user_id = auth.uid()

            OR

            exists (
                select 1
                from tenant_members tm
                where tm.tenant_id = b.tenant_id
                and tm.user_id = auth.uid()
                and tm.role = 'admin'
            )

        )

    )

);


create policy "modify own lines"
on budget_lines
for all
using (

    exists (
        select 1
        from budgets b
        where b.id = budget_lines.budget_id
        and b.user_id = auth.uid()
    )

);