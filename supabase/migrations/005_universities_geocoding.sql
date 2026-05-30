-- Universities: optional coords (filled via geocoding), admin create/update, map metadata

alter table public.universities alter column lat drop not null;
alter table public.universities alter column lng drop not null;

alter table public.universities add column if not exists map_zoom integer default 15;
alter table public.universities add column if not exists nearby_areas text[] default '{}';

update public.universities set map_zoom = 15 where map_zoom is null;
update public.universities set nearby_areas = '{}' where nearby_areas is null;

drop policy if exists "Admins manage universities" on public.universities;
create policy "Admins manage universities" on public.universities
  for all using (public.is_admin())
  with check (public.is_admin());

create or replace function public.admin_update_university_coords(
  p_university_id integer,
  p_lat double precision,
  p_lng double precision,
  p_map_zoom integer default 15
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  update public.universities
  set lat = p_lat, lng = p_lng, map_zoom = coalesce(p_map_zoom, 15)
  where id = p_university_id;
end;
$$;

create or replace function public.admin_create_university(
  p_name text,
  p_city text,
  p_slug text,
  p_short_name text,
  p_lat double precision,
  p_lng double precision,
  p_map_zoom integer default 15,
  p_request_id uuid default null
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

  insert into public.universities (name, slug, short_name, city, lat, lng, map_zoom)
  values (p_name, p_slug, p_short_name, p_city, p_lat, p_lng, coalesce(p_map_zoom, 15))
  on conflict (slug) do update
    set name = excluded.name,
        short_name = excluded.short_name,
        city = excluded.city,
        lat = excluded.lat,
        lng = excluded.lng,
        map_zoom = excluded.map_zoom
  returning id into new_id;

  if p_request_id is not null then
    update public.university_requests
    set status = 'approved'
    where id = p_request_id;
  end if;

  return new_id;
end;
$$;

grant execute on function public.admin_update_university_coords(integer, double precision, double precision, integer) to authenticated;
grant execute on function public.admin_create_university(text, text, text, text, double precision, double precision, integer, uuid) to authenticated;
