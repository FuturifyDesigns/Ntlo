-- Roll back failed first-time signups so users can retry with the same email.
-- Deletes auth.users (profiles cascade) when setup was never finished.

create or replace function public.profile_signup_incomplete(p public.profiles)
returns boolean
language sql
immutable
as $$
  select coalesce(trim(p.phone), '') = ''
    or (p.role = 'student' and p.gender is null);
$$;

create or replace function public.abandon_incomplete_signup()
returns void
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_created timestamptz;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select created_at into v_created from auth.users where id = v_uid;
  if not found then
    return;
  end if;

  if v_created < now() - interval '24 hours' then
    raise exception 'Cannot abandon this account';
  end if;

  select * into v_profile from public.profiles where id = v_uid;

  if found and not public.profile_signup_incomplete(v_profile) then
    raise exception 'Profile already complete';
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

grant execute on function public.abandon_incomplete_signup() to authenticated;
