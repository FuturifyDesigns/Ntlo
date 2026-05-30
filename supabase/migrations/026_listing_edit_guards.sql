-- Listing edit guards: block material changes while rented or during active applications.
-- Run after 025_rented_visibility_changes_requested.sql

create or replace function public.listing_has_active_applications(p_listing_id uuid)
returns boolean language sql stable security definer set search_path = public set row_security = off as $$
  select exists (
    select 1 from public.listing_applications la
    where la.listing_id = p_listing_id
      and la.status in ('submitted', 'under_review', 'changes_requested', 'accepted')
  );
$$;

create or replace function public.listing_material_fields_changed(
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
    or p_old.utilities_included is distinct from p_new.utilities_included
    or p_old.occupancy_status is distinct from p_new.occupancy_status
    or p_old.placed_application_id is distinct from p_new.placed_application_id;
$$;

create or replace function public.guard_listing_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if auth.uid() is distinct from old.landlord_id and not public.is_admin() then
    return new;
  end if;

  if not public.listing_material_fields_changed(old, new) then
    return new;
  end if;

  if coalesce(old.occupancy_status, 'available') = 'rented' then
    raise exception 'LISTING_RENTED_LOCKED: Cannot change price, location, room type, or amenities while a tenant is renting this room. Update description or contact details only, or list again when vacant.';
  end if;

  if public.listing_has_active_applications(old.id) then
    raise exception 'LISTING_APPLICATION_LOCKED: Cannot change price, location, room type, or amenities while applications are active. Wait until applications are resolved or list again.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_listing_update on public.listings;
create trigger trg_guard_listing_update
  before update on public.listings
  for each row execute function public.guard_listing_update();

create or replace function public.guard_listing_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is distinct from old.landlord_id and not public.is_admin() then
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

drop trigger if exists trg_guard_listing_delete on public.listings;
create trigger trg_guard_listing_delete
  before delete on public.listings
  for each row execute function public.guard_listing_delete();

-- Landlords can read competitor listings (already public select); ensure occupancy visible
grant execute on function public.listing_has_active_applications(uuid) to authenticated;

create or replace function public.get_listing_edit_policy(p_listing_id uuid)
returns jsonb language plpgsql security definer set search_path = public set row_security = off as $$
declare
  v_listing public.listings%rowtype;
  v_active int;
begin
  if auth.uid() is null then
    return jsonb_build_object('allowed', false, 'reason', 'auth');
  end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'not_found');
  end if;

  if auth.uid() not in (v_listing.landlord_id) and not public.is_admin() then
    return jsonb_build_object('allowed', false, 'reason', 'forbidden');
  end if;

  select count(*)::int into v_active
  from public.listing_applications la
  where la.listing_id = p_listing_id
    and la.status in ('submitted', 'under_review', 'changes_requested', 'accepted');

  return jsonb_build_object(
    'occupancy_status', coalesce(v_listing.occupancy_status, 'available'),
    'active_applications', v_active,
    'material_locked',
      coalesce(v_listing.occupancy_status, 'available') = 'rented'
      or v_active > 0,
    'locked_fields',
      case
        when coalesce(v_listing.occupancy_status, 'available') = 'rented' or v_active > 0 then
          jsonb_build_array(
            'price', 'room_type', 'gender_preference', 'lat', 'lng', 'address', 'area', 'city',
            'nearest_university_id', 'custom_university_name', 'custom_university_city',
            'distance_to_campus', 'amenities', 'deposit_pula', 'utilities_included'
          )
        else '[]'::jsonb
      end,
    'reason',
      case
        when coalesce(v_listing.occupancy_status, 'available') = 'rented' then 'rented'
        when v_active > 0 then 'active_applications'
        else null
      end
  );
end;
$$;

grant execute on function public.get_listing_edit_policy(uuid) to authenticated;
