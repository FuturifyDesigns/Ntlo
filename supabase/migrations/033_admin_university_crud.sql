-- Admin update/delete universities with safe FK cleanup.
-- Run after 032_university_publish_preview.sql

create or replace function public.admin_update_university(
  p_id integer,
  p_name text,
  p_city text,
  p_slug text,
  p_short_name text,
  p_lat double precision,
  p_lng double precision,
  p_map_zoom integer default 15,
  p_nearby_areas text[] default '{}',
  p_image_url text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  if not exists (select 1 from public.universities where id = p_id) then
    raise exception 'University not found';
  end if;

  if exists (
    select 1 from public.universities
    where slug = p_slug and id <> p_id
  ) then
    raise exception 'Another university already uses this slug';
  end if;

  update public.universities
  set
    name = p_name,
    city = p_city,
    slug = p_slug,
    short_name = p_short_name,
    lat = p_lat,
    lng = p_lng,
    map_zoom = coalesce(p_map_zoom, 15),
    nearby_areas = coalesce(p_nearby_areas, '{}'),
    image_url = coalesce(p_image_url, image_url)
  where id = p_id;

  return p_id;
end;
$$;

create or replace function public.admin_delete_university(p_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listings integer := 0;
  v_profiles integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  if not exists (select 1 from public.universities where id = p_id) then
    raise exception 'University not found';
  end if;

  update public.listings
  set nearest_university_id = null
  where nearest_university_id = p_id;
  get diagnostics v_listings = row_count;

  update public.profiles
  set university_id = null
  where university_id = p_id;
  get diagnostics v_profiles = row_count;

  delete from public.universities where id = p_id;

  return jsonb_build_object(
    'listings_cleared', v_listings,
    'profiles_cleared', v_profiles
  );
end;
$$;

grant execute on function public.admin_update_university(
  integer, text, text, text, text, double precision, double precision, integer, text[], text
) to authenticated;

grant execute on function public.admin_delete_university(integer) to authenticated;
