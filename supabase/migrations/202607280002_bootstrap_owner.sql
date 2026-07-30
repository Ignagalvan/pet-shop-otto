create or replace function public.claim_initial_owner(
  p_full_name text default 'Dueño de Pet Shop Otto'
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  created_profile public.profiles;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  lock table public.profiles in exclusive mode;

  if exists (select 1 from public.profiles) then
    raise exception 'The initial owner has already been configured';
  end if;

  insert into public.profiles (id, full_name, role)
  values ((select auth.uid()), nullif(trim(p_full_name), ''), 'owner')
  returning * into created_profile;

  return created_profile;
end;
$$;

revoke all on function public.claim_initial_owner(text) from public;
revoke all on function public.claim_initial_owner(text) from anon;
grant execute on function public.claim_initial_owner(text) to authenticated;
