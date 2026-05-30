-- Student gender, application validation, rental history, relist cycle.
-- Run after 015_simplified_application_flow.sql

-- ── Student gender on profiles ──

alter table public.profiles
  add column if not exists gender text check (gender is null or gender in ('male', 'female'));

create index if not exists idx_profiles_gender on public.profiles(gender) where gender is not null;

-- ── Application status: ended (tenant moved out / listing relisted) ──

alter table public.listing_applications drop constraint if exists listing_applications_status_check;
alter table public.listing_applications add constraint listing_applications_status_check
  check (status in ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn', 'rented', 'ended'));

-- ── Rental history (admin + dispute reference) ──

create table if not exists public.listing_rental_history (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  application_id uuid references public.listing_applications(id) on delete set null,
  student_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  rented_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text,
  created_at timestamptz default now()
);

create index if not exists idx_rental_history_listing on public.listing_rental_history(listing_id, rented_at desc);
create index if not exists idx_rental_history_student on public.listing_rental_history(student_id, rented_at desc);

alter table public.listing_rental_history enable row level security;

create policy "Parties and admin read rental history" on public.listing_rental_history
  for select using (
    public.is_admin()
    or auth.uid() in (student_id, landlord_id)
  );

-- ── Simplify application docs to registration proof only ──

alter table public.application_documents drop constraint if exists application_documents_doc_type_check;
alter table public.application_documents add constraint application_documents_doc_type_check
  check (doc_type in ('registration_proof', 'student_id', 'student_card'));

-- ── Profile setup with gender ──

drop function if exists public.complete_own_profile(text, text, text, integer);

create or replace function public.complete_own_profile(
  p_phone text,
  p_role text,
  p_full_name text default null,
  p_university_id integer default null,
  p_gender text default null
)
returns void language plpgsql security definer set search_path = public as $$
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

-- ── Shared gender / listing checks ──

create or replace function public.gender_matches_listing(p_student_gender text, p_listing_pref text)
returns boolean language sql immutable as $$
  select coalesce(p_listing_pref, 'any') = 'any'
    or p_student_gender = p_listing_pref;
$$;

create or replace function public.validate_student_listing_access(
  p_student_id uuid,
  p_listing_id uuid,
  p_for_apply boolean default true
)
returns void language plpgsql security definer set search_path = public as $$
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

-- ── Application insert validation ──

create or replace function public.guard_listing_application_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.validate_student_listing_access(new.student_id, new.listing_id, true);

  if exists (
    select 1 from public.listing_applications la
    where la.listing_id = new.listing_id
      and la.student_id = new.student_id
      and la.status not in ('rejected', 'withdrawn', 'ended')
      and la.id is distinct from new.id
  ) then
    raise exception 'You already have an active application for this room';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_listing_application_insert on public.listing_applications;
create trigger trg_guard_listing_application_insert
  before insert on public.listing_applications
  for each row execute function public.guard_listing_application_insert();

-- ── Viewing request gender validation ──

create or replace function public.guard_viewing_request_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.validate_student_listing_access(new.student_id, new.listing_id, false);
  return new;
end;
$$;

drop trigger if exists trg_guard_viewing_request_insert on public.viewing_requests;
create trigger trg_guard_viewing_request_insert
  before insert on public.viewing_requests
  for each row execute function public.guard_viewing_request_insert();

-- ── Mark rented: one active rental, auto-end previous when moving ──

create or replace function public.mark_application_rented(p_application_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  app public.listing_applications%rowtype;
  prev_app_id uuid;
begin
  select * into app from public.listing_applications where id = p_application_id;
  if not found then raise exception 'Application not found'; end if;
  if auth.uid() not in (app.landlord_id) and not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if app.status <> 'accepted' then
    raise exception 'Only accepted applications can be marked as rented';
  end if;

  -- Student moving: end previous rental on another listing
  select la.id into prev_app_id
  from public.listing_applications la
  where la.student_id = app.student_id
    and la.status = 'rented'
    and la.id <> app.id
  limit 1;

  if prev_app_id is not null then
    update public.listing_applications
    set status = 'ended', updated_at = now()
    where id = prev_app_id;

    update public.listing_rental_history
    set ended_at = now(), end_reason = 'moved_to_new_listing'
    where application_id = prev_app_id and ended_at is null;

    update public.listings
    set available = true, placed_application_id = null
    where placed_application_id = prev_app_id;
  end if;

  update public.listing_applications
  set status = 'rented', rented_at = now(), updated_at = now()
  where id = p_application_id;

  update public.listings
  set available = false, placed_application_id = p_application_id
  where id = app.listing_id;

  insert into public.listing_rental_history (
    listing_id, application_id, student_id, landlord_id, rented_at
  )
  values (app.listing_id, app.id, app.student_id, app.landlord_id, now());

  update public.listing_applications
  set
    status = 'rejected',
    landlord_notes = coalesce(landlord_notes, 'This room has been rented to another applicant.'),
    updated_at = now()
  where listing_id = app.listing_id
    and id <> p_application_id
    and status in ('submitted', 'under_review', 'accepted');
end;
$$;

-- ── Relist room (landlord cycle) ──

create or replace function public.relist_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_listing public.listings%rowtype;
  v_app_id uuid;
begin
  select * into v_listing from public.listings where id = p_listing_id;
  if not found then raise exception 'Listing not found'; end if;
  if auth.uid() not in (v_listing.landlord_id) and not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if v_listing.available then
    raise exception 'Listing is already available';
  end if;

  v_app_id := v_listing.placed_application_id;

  if v_app_id is not null then
    update public.listing_applications
    set status = 'ended', updated_at = now()
    where id = v_app_id and status = 'rented';

    update public.listing_rental_history
    set ended_at = now(), end_reason = 'landlord_relisted'
    where application_id = v_app_id and ended_at is null;
  end if;

  update public.listings
  set available = true, placed_application_id = null
  where id = p_listing_id;
end;
$$;

grant execute on function public.relist_listing(uuid) to authenticated;

alter publication supabase_realtime add table public.listing_rental_history;
