-- Relist without admin re-review; require all current docs marked OK before admin approve.

-- Content-only material changes (exclude occupancy relist toggles).
create or replace function public.listing_content_fields_changed(
  p_old public.listings,
  p_new public.listings
)
returns boolean language sql immutable as $$
  select
    p_old.price is distinct from p_new.price
    or p_old.room_type is distinct from p_new.room_type
    or p_old.gender_preference is distinct from p_new.gender_preference
    or p_old.lat is distinct from p_new.lat
    or p_old.lng is distinct from p_new.lng
    or p_old.address is distinct from p_new.address
    or p_old.area is distinct from p_new.area
    or p_old.city is distinct from p_new.city
    or p_old.nearest_university_id is distinct from p_new.nearest_university_id
    or p_old.custom_university_name is distinct from p_new.custom_university_name
    or p_old.custom_university_city is distinct from p_new.custom_university_city
    or p_old.distance_to_campus is distinct from p_new.distance_to_campus
    or p_old.amenities is distinct from p_new.amenities
    or p_old.deposit_pula is distinct from p_new.deposit_pula
    or p_old.utilities_included is distinct from p_new.utilities_included;
$$;

-- Latest doc per type must all be admin-marked OK before approval.
create or replace function public.verification_latest_docs_all_approved(
  p_user_id uuid default null,
  p_listing_id uuid default null
)
returns boolean language sql stable security definer set search_path = public set row_security = off as $$
  select not exists (
    select 1
    from (
      select distinct on (vd.doc_type) vd.status
      from public.verification_documents vd
      where (
        p_listing_id is not null and vd.listing_id = p_listing_id
      ) or (
        p_listing_id is null and p_user_id is not null
        and vd.user_id = p_user_id and vd.listing_id is null
      )
      order by vd.doc_type, vd.created_at desc
    ) latest
    where latest.status is distinct from 'approved'
  );
$$;

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

  if old.occupancy_status is distinct from new.occupancy_status
     and coalesce(old.verification_status, 'pending') <> 'approved' then
    raise exception 'LISTING_REVIEW_LOCKED: Cannot change availability while listing is under admin review.';
  end if;

  if new.verification_status = 'pending'
     and old.verification_status in ('changes_requested', 'rejected')
     and new.verification_status is distinct from old.verification_status then
    new.is_verified := false;
    new.verification_notes := null;
    return new;
  end if;

  -- Material content edit to approved listing → re-review (not occupancy relist).
  if public.listing_content_fields_changed(old, new)
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

create or replace function public.trg_notify_listing_rereview()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE'
     and old.verification_status = 'approved'
     and new.verification_status = 'pending'
     and public.listing_content_fields_changed(old, new) then
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

create or replace function public.admin_review_landlord(
  target_id uuid,
  approved boolean,
  notes text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  if approved and not public.verification_latest_docs_all_approved(p_user_id := target_id) then
    raise exception 'All documents must be marked OK before approving';
  end if;

  update public.profiles
  set
    verification_status = case when approved then 'approved' else 'rejected' end,
    is_verified = approved,
    verification_notes = notes
  where id = target_id and role = 'landlord';

  update public.verification_documents
  set
    status = case when approved then 'approved' else 'rejected' end,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = notes
  where user_id = target_id and listing_id is null and status in ('pending', 'changes_requested');
end;
$$;

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

  if approved and not public.verification_latest_docs_all_approved(p_listing_id := target_listing_id) then
    raise exception 'All documents must be marked OK before approving';
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

grant execute on function public.verification_latest_docs_all_approved(uuid, uuid) to authenticated;
