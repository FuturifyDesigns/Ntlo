-- Unique profile phone numbers with international normalization (Botswana +267 default).

create or replace function public.normalize_profile_phone(p_phone text)
returns text
language sql
immutable
as $$
  select case
    when p_phone is null or regexp_replace(p_phone, '\D', '', 'g') = '' then null
    when length(regexp_replace(p_phone, '\D', '', 'g')) = 8
      and regexp_replace(p_phone, '\D', '', 'g') ~ '^7'
      then '267' || regexp_replace(p_phone, '\D', '', 'g')
    else regexp_replace(p_phone, '\D', '', 'g')
  end;
$$;

-- Clear duplicate phones (keep earliest account) before adding uniqueness.
with ranked as (
  select
    id,
    row_number() over (
      partition by public.normalize_profile_phone(phone)
      order by created_at nulls last, id
    ) as rn
  from public.profiles
  where public.normalize_profile_phone(phone) is not null
)
update public.profiles p
set phone = null
from ranked r
where p.id = r.id
  and r.rn > 1;

update public.profiles
set phone = public.normalize_profile_phone(phone)
where phone is not null;

create unique index if not exists profiles_phone_unique_idx
  on public.profiles (public.normalize_profile_phone(phone))
  where public.normalize_profile_phone(phone) is not null;

create or replace function public.is_phone_available(
  p_phone text,
  p_exclude_user_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_norm text;
begin
  v_norm := public.normalize_profile_phone(p_phone);
  if v_norm is null then
    return false;
  end if;

  return not exists (
    select 1
    from public.profiles p
    where public.normalize_profile_phone(p.phone) = v_norm
      and (p_exclude_user_id is null or p.id <> p_exclude_user_id)
  );
end;
$$;

grant execute on function public.is_phone_available(text, uuid) to anon, authenticated;

create or replace function public.complete_own_profile(
  p_phone text,
  p_role text,
  p_full_name text default null,
  p_university_id integer default null,
  p_gender text default null
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_current public.profiles%rowtype;
  v_norm text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_role not in ('student', 'landlord') then raise exception 'Invalid role'; end if;

  v_norm := public.normalize_profile_phone(p_phone);
  if v_norm is null then raise exception 'Phone is required'; end if;

  if not public.is_phone_available(v_norm, auth.uid()) then
    raise exception 'PHONE_TAKEN: This phone number is already registered on Ntlo';
  end if;

  if p_role = 'student' then
    if p_gender is null or p_gender not in ('male', 'female') then
      raise exception 'Gender is required for students';
    end if;
  end if;

  select * into v_current from public.profiles where id = auth.uid();

  if not found then
    insert into public.profiles (id, full_name, role, phone, university_id, gender, verification_status)
    values (
      auth.uid(),
      coalesce(nullif(trim(p_full_name), ''), 'User'),
      p_role,
      v_norm,
      case when p_role = 'student' then p_university_id else null end,
      case when p_role = 'student' then p_gender else null end,
      'none'
    );
    return;
  end if;

  if coalesce(trim(v_current.phone), '') <> '' and p_role <> v_current.role then
    raise exception 'Cannot change account role after profile is complete';
  end if;

  update public.profiles
  set
    phone = v_norm,
    role = p_role,
    full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
    university_id = case when p_role = 'student' then p_university_id else null end,
    gender = case when p_role = 'student' then p_gender else null end
  where id = auth.uid();
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_norm text;
begin
  v_norm := public.normalize_profile_phone(new.raw_user_meta_data->>'phone');

  if v_norm is not null and not public.is_phone_available(v_norm, new.id) then
    raise exception 'PHONE_TAKEN: This phone number is already registered on Ntlo';
  end if;

  insert into public.profiles (id, full_name, role, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'User'
    ),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    v_norm
  );
  return new;
end;
$$;
