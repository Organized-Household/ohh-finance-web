begin;

-- Add is_active to profiles
alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- Add is_active to tenant_members
alter table public.tenant_members
  add column if not exists is_active boolean not null default true;

-- Index for common query pattern
create index if not exists idx_tenant_members_active
  on public.tenant_members (tenant_id, is_active);

create index if not exists idx_profiles_active
  on public.profiles (user_id, is_active);

commit;
