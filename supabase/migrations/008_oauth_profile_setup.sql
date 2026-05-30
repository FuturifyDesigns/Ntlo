-- Fix OAuth / social signup: allow role + phone during initial profile setup
-- Run after 002_admin_verification.sql

drop policy if exists "Profiles editable by owner" on public.profiles;

create policy "Profiles editable by owner" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      role = (select p.role from public.profiles p where p.id = auth.uid())
      or coalesce(trim((select p.phone from public.profiles p where p.id = auth.uid())), '') = ''
    )
  );

create or replace function public.complete_own_profile(
  p_phone text,
  p_role text,
  p_full_name text default null,
  p_university_id integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_role not in ('student', 'landlord') then
    raise exception 'Invalid role';
  end if;

  if coalesce(trim(p_phone), '') = '' then
    raise exception 'Phone is required';
  end if;

  select * into v_current from public.profiles where id = auth.uid();

  if not found then
    insert into public.profiles (id, full_name, role, phone, university_id, verification_status)
    values (
      auth.uid(),
      coalesce(nullif(trim(p_full_name), ''), 'User'),
      p_role,
      trim(p_phone),
      case when p_role = 'student' then p_university_id else null end,
      case when p_role = 'landlord' then 'none' else 'none' end
    );
    return;
  end if;

  if coalesce(trim(v_current.phone), '') <> '' and p_role <> v_current.role then
    raise exception 'Cannot change account role after profile is complete';
  end if;

  update public.profiles
  set
    phone = trim(p_phone),
    role = p_role,
    full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
    university_id = case when p_role = 'student' then p_university_id else null end
  where id = auth.uid();
end;
$$;

grant execute on function public.complete_own_profile(text, text, text, integer) to authenticated;
