begin;

alter table public.profiles
  add column if not exists first_name text null,
  add column if not exists last_name  text null;

comment on column public.profiles.first_name is 'Given name of the household member';
comment on column public.profiles.last_name  is 'Family name of the household member';

commit;
