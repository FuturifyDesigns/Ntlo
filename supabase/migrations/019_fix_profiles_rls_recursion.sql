-- Fix infinite recursion in profiles RLS (OAuth + email signup).
-- Cause: is_admin() and inline subqueries on profiles inside profiles policies
-- re-trigger the same RLS checks. Use row_security = off in security definer helpers.

-- ── Admin check (must bypass RLS when reading profiles) ──

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and coalesce(is_banned, false) = false
  );
$$;

-- ── Helpers for profile UPDATE policy (avoid self-referencing subqueries) ──

create or replace function public.own_profile_role()
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.own_profile_phone_is_empty()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(trim(phone), '') = '' from public.profiles where id = auth.uid();
$$;

-- ── SELECT: split owner vs admin so own-profile reads never call is_admin() ──

drop policy if exists "Profiles viewable by owner or admin" on public.profiles;

create policy "Profiles viewable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles viewable by admin" on public.profiles
  for select using (public.is_admin());

-- ── UPDATE: replace inline profiles subqueries ──

drop policy if exists "Profiles editable by owner" on public.profiles;

create policy "Profiles editable by owner" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      role = public.own_profile_role()
      or public.own_profile_phone_is_empty()
    )
  );

-- ── Security definer RPCs that read profiles ──

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
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_role not in ('student', 'landlord') then raise exception 'Invalid role'; end if;
  if coalesce(trim(p_phone), '') = '' then raise exception 'Phone is required'; end if;

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
      trim(p_phone),
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
    phone = trim(p_phone),
    role = p_role,
    full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
    university_id = case when p_role = 'student' then p_university_id else null end,
    gender = case when p_role = 'student' then p_gender else null end
  where id = auth.uid();
end;
$$;

grant execute on function public.complete_own_profile(text, text, text, integer, text) to authenticated;

create or replace function public.validate_student_listing_access(
  p_student_id uuid,
  p_listing_id uuid,
  p_for_apply boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_listing public.listings%rowtype;
  v_student public.profiles%rowtype;
begin
  select * into v_listing from public.listings where id = p_listing_id;
  if not found then raise exception 'Listing not found'; end if;
  if not v_listing.available then raise exception 'This room is no longer available'; end if;

  select * into v_student from public.profiles where id = p_student_id;
  if v_student.role <> 'student' then raise exception 'Only students can do this'; end if;
  if v_student.gender is null then
    raise exception 'Add your gender in your profile before applying or booking a viewing';
  end if;

  if not public.gender_matches_listing(v_student.gender, v_listing.gender_preference) then
    if v_listing.gender_preference = 'female' then
      raise exception 'This room is for female tenants only';
    elsif v_listing.gender_preference = 'male' then
      raise exception 'This room is for male tenants only';
    else
      raise exception 'You cannot apply to this room';
    end if;
  end if;

  if p_student_id = v_listing.landlord_id then
    raise exception 'You cannot apply to your own listing';
  end if;
end;
$$;
