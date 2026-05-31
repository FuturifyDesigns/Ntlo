-- Block occupancy changes while listing is not admin-approved.
-- Run after 028_oauth_profile_completion.sql

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
