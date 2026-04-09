create policy "transactions_update_for_tenant_members"
on public.transactions
for update
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = transactions.tenant_id
      and tm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = transactions.tenant_id
      and tm.user_id = auth.uid()
  )
);

create policy "transactions_delete_for_tenant_members"
on public.transactions
for delete
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = transactions.tenant_id
      and tm.user_id = auth.uid()
  )
);
