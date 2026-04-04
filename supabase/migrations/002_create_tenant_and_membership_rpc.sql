create or replace function public.create_tenant_and_membership(
  p_alias text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  if p_alias is null or btrim(p_alias) = '' then
    raise exception 'Household alias is required';
  end if;

  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  insert into public.tenants (alias)
  values (btrim(p_alias))
  returning id into v_tenant_id;

  insert into public.tenant_members (
    tenant_id,
    user_id,
    role
  )
  values (
    v_tenant_id,
    p_user_id,
    'admin'
  );

  return v_tenant_id;
end;
$$;

revoke all on function public.create_tenant_and_membership(text, uuid) from public;
grant execute on function public.create_tenant_and_membership(text, uuid) to authenticated;