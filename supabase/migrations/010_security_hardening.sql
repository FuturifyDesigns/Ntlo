-- Security hardening: stop users from escalating their own privileges.
-- Run in Supabase SQL Editor after 009_doc_feedback.sql
--
-- Background: RLS lets owners UPDATE their own profile/listing rows and INSERT
-- verification documents. The previous policies did NOT constrain which COLUMNS
-- could change, so a malicious user could self-approve (is_verified = true),
-- self-assign role = 'admin', un-ban themselves, or mark their own documents
-- as approved by calling the REST/RPC API directly. These BEFORE triggers
-- revert any privileged column change made by a non-admin. Service-role calls
-- (auth.uid() is null) and admins are unaffected.

-- ── Profiles ──────────────────────────────────────────────────────────────
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Nobody can self-provision an admin / pre-verified / pre-banned profile
    if new.role not in ('student', 'landlord') then
      new.role := 'student';
    end if;
    new.is_verified := false;
    new.is_banned := false;
    new.banned_at := null;
    new.banned_reason := null;
    if coalesce(new.verification_status, 'none') not in ('none', 'pending') then
      new.verification_status := 'none';
    end if;
    new.verification_notes := null;
    return new;
  end if;

  -- UPDATE by the owner: lock every privileged column to its old value …
  new.role := old.role;
  new.is_verified := old.is_verified;
  new.is_banned := old.is_banned;
  new.banned_at := old.banned_at;
  new.banned_reason := old.banned_reason;
  new.verification_notes := old.verification_notes;

  -- … except the owner may (re)submit themselves for review.
  if new.verification_status is distinct from old.verification_status then
    if not (new.verification_status = 'pending'
            and old.verification_status in ('none', 'rejected', 'changes_requested')) then
      new.verification_status := old.verification_status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_fields on public.profiles;
create trigger trg_protect_profile_fields
  before insert or update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ── Verification documents ──────────────────────────────────────────────────
create or replace function public.protect_verification_doc_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Uploads always start unreviewed; only admins set review fields.
    new.status := 'pending';
    new.admin_notes := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    return new;
  end if;

  -- Owners cannot change review fields on existing documents.
  new.status := old.status;
  new.admin_notes := old.admin_notes;
  new.reviewed_at := old.reviewed_at;
  new.reviewed_by := old.reviewed_by;
  return new;
end;
$$;

drop trigger if exists trg_protect_verification_doc on public.verification_documents;
create trigger trg_protect_verification_doc
  before insert or update on public.verification_documents
  for each row execute function public.protect_verification_doc_fields();

-- ── Listings ────────────────────────────────────────────────────────────────
create or replace function public.protect_listing_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.verification_status := 'pending';
    new.verification_notes := null;
    return new;
  end if;

  -- Landlords can edit their listing details but not self-verify it.
  new.is_verified := old.is_verified;
  new.verification_status := old.verification_status;
  new.verification_notes := old.verification_notes;
  return new;
end;
$$;

drop trigger if exists trg_protect_listing_fields on public.listings;
create trigger trg_protect_listing_fields
  before insert or update on public.listings
  for each row execute function public.protect_listing_fields();

-- ── Defense in depth: make sure RLS is on everywhere ────────────────────────
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.verification_documents enable row level security;
alter table public.university_requests enable row level security;
