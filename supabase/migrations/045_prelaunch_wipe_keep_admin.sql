-- Pre-launch wipe: remove all users and app data except the admin account.
-- Run once in Supabase SQL Editor (Dashboard → SQL → New query).
--
-- KEEPS: universities, admin auth user + profile
-- REMOVES: all other auth users, listings, messages, applications, reviews, etc.
-- DOES NOT remove Storage bucket files — empty listing-photos / verification buckets manually if needed.

do $$
declare
  v_admin uuid := '5f5b0d88-65c6-48e2-88ff-47e7b3bd3806';
  v_deleted_users int;
begin
  if not exists (select 1 from auth.users where id = v_admin) then
    raise exception 'Admin user % not found in auth.users — aborting.', v_admin;
  end if;

  -- Ensure admin role (safe if already set).
  update public.profiles
  set role = 'admin'
  where id = v_admin;

  -- Break optional FKs that don't cascade on profile delete.
  update public.move_in_checklist_items
  set completed_by = null
  where completed_by is not null and completed_by <> v_admin;

  update public.verification_documents
  set reviewed_by = null
  where reviewed_by is not null and reviewed_by <> v_admin;

  update public.payment_receipts
  set reviewed_by = null
  where reviewed_by is not null and reviewed_by <> v_admin;

  update public.viewing_requests
  set cancelled_by = null
  where cancelled_by is not null and cancelled_by <> v_admin;

  -- Non-user tables that may hold test / signup data.
  delete from public.university_requests;

  -- Clear admin inbox too for a clean launch (optional — comment out to keep admin notifications).
  delete from public.notifications;

  -- Delete every auth user except admin (profiles + related rows cascade).
  delete from auth.users
  where id <> v_admin;

  get diagnostics v_deleted_users = row_count;

  raise notice 'Pre-launch wipe complete. Deleted % non-admin auth user(s). Admin kept: %', v_deleted_users, v_admin;
end $$;

-- Quick sanity check (should show 1 user, 0 listings, universities unchanged).
select 'auth.users' as item, count(*)::text as count from auth.users
union all
select 'profiles', count(*)::text from public.profiles
union all
select 'profiles (admin)', count(*)::text from public.profiles where role = 'admin'
union all
select 'listings', count(*)::text from public.listings
union all
select 'conversations', count(*)::text from public.conversations
union all
select 'notifications', count(*)::text from public.notifications
union all
select 'universities', count(*)::text from public.universities;
