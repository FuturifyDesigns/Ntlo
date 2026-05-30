-- Listings stay hidden until admin approves; changes-requested flow; notifications.
-- Run after 026_listing_edit_guards.sql

-- ── Listing verification states (match landlord profile flow) ──
alter table public.listings drop constraint if exists listings_verification_status_check;
alter table public.listings add constraint listings_verification_status_check
  check (verification_status in ('pending', 'approved', 'rejected', 'changes_requested', 'withdrawn'));

-- ── Public visibility: approved listings only (landlords see own; admins see all) ──
drop policy if exists "Anyone can view available listings" on public.listings;
drop policy if exists "Public view approved listings" on public.listings;

-- Grandfather listings already on the platform before the publish gate (they were visible due to open RLS).
update public.listings
set verification_status = 'approved', is_verified = true
where verification_status = 'pending';

create policy "Public view approved listings" on public.listings
  for select using (
    verification_status = 'approved'
    or landlord_id = auth.uid()
    or public.is_admin()
  );

-- ── Listing doc feedback → flag listing for resubmission ──
create or replace function public.admin_review_document(
  target_doc_id uuid,
  new_status text,
  note text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  doc_user uuid;
  doc_listing uuid;
  v_title text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  if new_status not in ('pending', 'approved', 'rejected', 'changes_requested') then
    raise exception 'Invalid status';
  end if;

  update public.verification_documents
  set
    status = new_status,
    admin_notes = note,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = target_doc_id
  returning user_id, listing_id into doc_user, doc_listing;

  if new_status = 'changes_requested' and doc_user is not null and doc_listing is null then
    update public.profiles
    set verification_status = 'changes_requested'
    where id = doc_user and role = 'landlord';
  end if;

  if new_status = 'changes_requested' and doc_listing is not null then
    select title into v_title from public.listings where id = doc_listing;
    update public.listings
    set
      verification_status = 'changes_requested',
      verification_notes = coalesce(nullif(trim(note), ''), verification_notes)
    where id = doc_listing;

    perform public.notify_user(
      (select landlord_id from public.listings where id = doc_listing),
      'listing_changes_requested',
      'Listing needs updates',
      coalesce(v_title, 'Your listing needs document fixes before it can go live'),
      '/landlord',
      doc_listing,
      true
    );
  end if;
end;
$$;

-- ── Protect listing fields: resubmit + re-review on material edits ──
create or replace function public.protect_listing_fields()
returns trigger language plpgsql security definer set search_path = public as $$
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

  -- Resubmit for admin review
  if new.verification_status = 'pending'
     and old.verification_status in ('changes_requested', 'rejected')
     and new.verification_status is distinct from old.verification_status then
    new.is_verified := false;
    new.verification_notes := null;
    return new;
  end if;

  -- Material edit to approved listing → re-review
  if public.listing_material_fields_changed(old, new)
     and old.verification_status = 'approved'
     and coalesce(old.occupancy_status, 'available') <> 'rented'
     and not public.listing_has_active_applications(old.id) then
    new.verification_status := 'pending';
    new.is_verified := false;
    new.verification_notes := null;
    return new;
  end if;

  new.is_verified := old.is_verified;
  new.verification_status := old.verification_status;
  new.verification_notes := old.verification_notes;
  return new;
end;
$$;

-- ── Admin review listing + notifications ──
create or replace function public.admin_review_listing(
  target_listing_id uuid,
  approved boolean,
  notes text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_landlord uuid;
  v_title text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  select landlord_id, title into v_landlord, v_title
  from public.listings where id = target_listing_id;

  update public.listings
  set
    verification_status = case when approved then 'approved' else 'rejected' end,
    is_verified = approved,
    verification_notes = notes
  where id = target_listing_id;

  update public.verification_documents
  set
    status = case when approved then 'approved' else 'rejected' end,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = notes
  where listing_id = target_listing_id and status in ('pending', 'changes_requested');

  if v_landlord is not null then
    perform public.notify_user(
      v_landlord,
      case when approved then 'listing_approved' else 'listing_rejected' end,
      case when approved then 'Listing approved' else 'Listing not approved' end,
      coalesce(v_title, 'Your listing'),
      '/landlord',
      target_listing_id,
      true
    );
  end if;
end;
$$;

-- ── Landlord withdraw / remove listing from market ──
create or replace function public.landlord_withdraw_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_listing public.listings%rowtype;
begin
  select * into v_listing from public.listings where id = p_listing_id;
  if not found then raise exception 'Listing not found'; end if;
  if auth.uid() not in (v_listing.landlord_id) and not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  if coalesce(v_listing.occupancy_status, 'available') = 'rented' then
    raise exception 'LISTING_RENTED_LOCKED: Cannot remove a listing while rented';
  end if;

  if public.listing_has_active_applications(v_listing.id) then
    raise exception 'LISTING_APPLICATION_LOCKED: Resolve active applications before removing this listing';
  end if;

  -- Hard delete if never approved; soft withdraw if was public
  if v_listing.verification_status in ('pending', 'rejected', 'changes_requested') then
    delete from public.listings where id = p_listing_id;
    perform public.notify_admins(
      'admin_listing_removed',
      'Listing removed',
      coalesce(v_listing.title, 'Landlord removed a pending listing'),
      '/admin?tab=listings',
      p_listing_id,
      false
    );
  else
    update public.listings
    set
      verification_status = 'withdrawn',
      occupancy_status = 'unavailable',
      available = false
    where id = p_listing_id;

    perform public.notify_admins(
      'admin_listing_removed',
      'Listing withdrawn',
      coalesce(v_listing.title, 'Landlord removed a listing from the market'),
      '/admin?tab=listings',
      p_listing_id,
      false
    );
  end if;
end;
$$;

grant execute on function public.landlord_withdraw_listing(uuid) to authenticated;

-- ── Notification types ──
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'message',
    'viewing_request', 'viewing_confirmed', 'viewing_declined', 'viewing_cancelled',
    'application_submitted', 'application_accepted', 'application_rejected',
    'application_withdrawn', 'application_changes_requested',
    'listing_submitted', 'listing_approved', 'listing_rejected', 'listing_changes_requested',
    'admin_listing_review', 'admin_listing_removed',
    'review_posted', 'admin_application', 'admin_review', 'admin_verification'
  ));

-- ── Notify on new listing submission ──
create or replace function public.trg_notify_listing_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.verification_status = 'pending' then
    perform public.notify_admins(
      'admin_listing_review',
      'New listing to review',
      coalesce(new.title, 'Landlord submitted a listing'),
      '/admin?tab=listings',
      new.id,
      true
    );
    perform public.notify_user(
      new.landlord_id,
      'listing_submitted',
      'Listing submitted for review',
      coalesce(new.title, 'We will review your listing before it goes live'),
      '/landlord',
      new.id,
      false
    );
  end if;

  if tg_op = 'UPDATE' then
    if old.verification_status is distinct from new.verification_status
       and new.verification_status = 'pending'
       and old.verification_status in ('changes_requested', 'rejected', 'approved') then
      perform public.notify_admins(
        'admin_listing_review',
        'Listing resubmitted',
        coalesce(new.title, 'Landlord resubmitted a listing'),
        '/admin?tab=listings',
        new.id,
        true
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_listing_review on public.listings;
create trigger trg_notify_listing_review
  after insert or update on public.listings
  for each row execute function public.trg_notify_listing_review();

-- Re-review after material edit notifies admin (after protect sets pending)
create or replace function public.trg_notify_listing_rereview()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE'
     and old.verification_status = 'approved'
     and new.verification_status = 'pending'
     and public.listing_material_fields_changed(old, new) then
    perform public.notify_admins(
      'admin_listing_review',
      'Listing updated — review again',
      coalesce(new.title, 'Approved listing was edited'),
      '/admin?tab=listings',
      new.id,
      true
    );
    perform public.notify_user(
      new.landlord_id,
      'listing_submitted',
      'Listing back in review',
      coalesce(new.title, 'Your edits are pending admin approval before going live again'),
      '/landlord',
      new.id,
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_listing_rereview on public.listings;
create trigger trg_notify_listing_rereview
  after update on public.listings
  for each row execute function public.trg_notify_listing_rereview();
