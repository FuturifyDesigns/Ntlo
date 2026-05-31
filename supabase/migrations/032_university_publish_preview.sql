-- University publish: store image + nearby areas; enable realtime for public list.
-- Run after 031_listing_updated_at_content_only.sql

alter table public.universities add column if not exists image_url text;

drop function if exists public.admin_create_university(
  text, text, text, text, double precision, double precision, integer, uuid
);

create or replace function public.admin_create_university(
  p_name text,
  p_city text,
  p_slug text,
  p_short_name text,
  p_lat double precision,
  p_lng double precision,
  p_map_zoom integer default 15,
  p_request_id uuid default null,
  p_nearby_areas text[] default '{}',
  p_image_url text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id integer;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  insert into public.universities (
    name, slug, short_name, city, lat, lng, map_zoom, nearby_areas, image_url
  )
  values (
    p_name,
    p_slug,
    p_short_name,
    p_city,
    p_lat,
    p_lng,
    coalesce(p_map_zoom, 15),
    coalesce(p_nearby_areas, '{}'),
    p_image_url
  )
  on conflict (slug) do update
    set name = excluded.name,
        short_name = excluded.short_name,
        city = excluded.city,
        lat = excluded.lat,
        lng = excluded.lng,
        map_zoom = excluded.map_zoom,
        nearby_areas = excluded.nearby_areas,
        image_url = coalesce(excluded.image_url, public.universities.image_url)
  returning id into new_id;

  if p_request_id is not null then
    update public.university_requests
    set status = 'approved'
    where id = p_request_id;
  end if;

  return new_id;
end;
$$;

grant execute on function public.admin_create_university(
  text, text, text, text, double precision, double precision, integer, uuid, text[], text
) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.universities;
exception
  when duplicate_object then null;
end $$;
