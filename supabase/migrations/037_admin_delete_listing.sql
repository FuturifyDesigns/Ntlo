-- Admin can remove any landlord listing with reason + landlord notification.
-- Run after 036_unban_notification.sql

create or replace function public.guard_listing_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return old;
  end if;

  if auth.uid() is distinct from old.landlord_id then
    return old;
  end if;

  if coalesce(old.occupancy_status, 'available') = 'rented' then
    raise exception 'LISTING_DELETE_RENTED: Cannot delete a listing while a tenant is renting. List again when vacant first.';
  end if;

  if public.listing_has_active_applications(old.id) then
    raise exception 'LISTING_APPLICATION_LOCKED: Cannot delete a listing with active applications.';
  end if;

  return old;
end;
$$;

create or replace function public.admin_delete_listing(
  p_listing_id uuid,
  p_reason_code text,
  p_reason_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings%rowtype;
  v_summary text;
  v_body text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  if p_reason_code is null or p_reason_code not in (
    'misleading_info', 'fake_photos', 'policy_violation',
    'duplicate_spam', 'safety_concern', 'unverified_property', 'other'
  ) then
    raise exception 'Invalid removal reason';
  end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if not found then
    raise exception 'Listing not found';
  end if;

  v_summary := case p_reason_code
    when 'misleading_info' then 'Misleading or inaccurate listing information'
    when 'fake_photos' then 'Fake or misleading photos'
    when 'policy_violation' then 'Terms of service violation'
    when 'duplicate_spam' then 'Duplicate or spam listing'
    when 'safety_concern' then 'Safety or fraud concern'
    when 'unverified_property' then 'Property could not be verified'
    else 'Policy violation'
  end;

  v_body := 'Your listing "' || coalesce(v_listing.title, 'Untitled') || '" has been removed by Ntlo.'
    || E'\n\nReason: ' || v_summary;
  if coalesce(trim(p_reason_note), '') <> '' then
    v_body := v_body || E'\n\n' || trim(p_reason_note);
  end if;
  v_body := v_body || E'\n\nYou may post a new listing if you address the issue above. Repeated violations may affect your account.';

  perform public.notify_user(
    v_listing.landlord_id,
    'listing_admin_removed',
    'Your listing was removed',
    v_body,
    '/landlord',
    p_listing_id,
    true
  );

  delete from public.listings where id = p_listing_id;

  if not found then
    raise exception 'Could not delete listing';
  end if;
end;
$$;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'message',
    'viewing_request', 'viewing_confirmed', 'viewing_declined', 'viewing_cancelled',
    'application_submitted', 'application_accepted', 'application_rejected',
    'application_withdrawn', 'application_changes_requested',
    'listing_submitted', 'listing_approved', 'listing_rejected', 'listing_changes_requested',
    'listing_admin_removed',
    'admin_listing_review', 'admin_listing_removed',
    'review_posted', 'admin_application', 'admin_review', 'admin_verification',
    'account_banned', 'account_unbanned'
  ));

grant execute on function public.admin_delete_listing(uuid, text, text) to authenticated;
