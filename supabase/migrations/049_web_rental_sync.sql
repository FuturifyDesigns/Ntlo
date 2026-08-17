-- Auto-synced Botswana student rentals, written daily by the sync-web-rentals
-- Edge Function. Replaces the GitHub Pages JSON round-trip so new listings go
-- live without a redeploy.
-- Run after 048_seed_web_rentals.sql

create table if not exists public.web_rental_listings (
  id text primary key,
  title text not null,
  description text,
  price integer,
  price_on_request boolean not null default false,
  room_type text not null default 'sharing',
  gender_preference text not null default 'any',
  area text,
  city text not null default 'Gaborone',
  address text,
  whatsapp_number text not null,
  contact_name text not null default 'Contact',
  campus_ids integer[] not null default '{}',
  custom_university_name text,
  distance_to_campus double precision,
  amenities text[] not null default '{}',
  photo_urls text[] not null default '{}',
  lat double precision,
  lng double precision,
  geo_precision text,
  deposit_pula integer,
  utilities_included text,
  source_label text,
  source_url text,
  fetched_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.web_rental_listings drop constraint if exists web_rental_listings_room_type_check;
alter table public.web_rental_listings add constraint web_rental_listings_room_type_check
  check (room_type in ('single', 'sharing', 'self_contained', 'cottage', 'house'));

alter table public.web_rental_listings drop constraint if exists web_rental_listings_gender_check;
alter table public.web_rental_listings add constraint web_rental_listings_gender_check
  check (gender_preference in ('any', 'male', 'female'));

create index if not exists idx_web_rentals_last_seen on public.web_rental_listings(last_seen_at desc);
create index if not exists idx_web_rentals_city on public.web_rental_listings(city);
create index if not exists idx_web_rentals_campus on public.web_rental_listings using gin(campus_ids);
create index if not exists idx_web_rentals_amenities on public.web_rental_listings using gin(amenities);

alter table public.web_rental_listings enable row level security;

-- Public catalogue: anyone may read, only the service role (Edge Function) writes.
drop policy if exists "Web rentals are public" on public.web_rental_listings;
create policy "Web rentals are public" on public.web_rental_listings
  for select using (true);

drop policy if exists "Web rentals are service-written" on public.web_rental_listings;
create policy "Web rentals are service-written" on public.web_rental_listings
  for all using (false) with check (false);

-- ── Sync run log (observability for the daily job) ──
create table if not exists public.web_rental_sync_runs (
  id bigserial primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fresh_count integer not null default 0,
  total_count integer not null default 0,
  pruned_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  ok boolean not null default false
);

alter table public.web_rental_sync_runs enable row level security;

drop policy if exists "Admins read sync runs" on public.web_rental_sync_runs;
create policy "Admins read sync runs" on public.web_rental_sync_runs
  for select using (public.is_admin());

-- ── Upsert helper used by the Edge Function ──
-- Takes the whole crawl as one JSON array so a run is a single round trip.
create or replace function public.upsert_web_rentals(p_listings jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.web_rental_listings as w (
    id, title, description, price, price_on_request, room_type, gender_preference,
    area, city, address, whatsapp_number, contact_name, campus_ids,
    custom_university_name, distance_to_campus, amenities, photo_urls,
    lat, lng, geo_precision, deposit_pula, utilities_included,
    source_label, source_url, fetched_at, last_seen_at
  )
  select
    item->>'id',
    item->>'title',
    item->>'description',
    nullif(item->>'price', '')::integer,
    coalesce((item->>'price_on_request')::boolean, false),
    coalesce(nullif(item->>'room_type', ''), 'sharing'),
    coalesce(nullif(item->>'gender_preference', ''), 'any'),
    item->>'area',
    coalesce(nullif(item->>'city', ''), 'Gaborone'),
    item->>'address',
    item->>'whatsapp_number',
    coalesce(nullif(item->>'contact_name', ''), 'Contact'),
    coalesce((
      select array_agg(value::integer) from jsonb_array_elements_text(item->'campus_ids')
    ), '{}'),
    item->>'custom_university_name',
    nullif(item->>'distance_to_campus', '')::double precision,
    coalesce((
      select array_agg(value) from jsonb_array_elements_text(item->'amenities')
    ), '{}'),
    coalesce((
      select array_agg(value) from jsonb_array_elements_text(item->'photo_urls')
    ), '{}'),
    nullif(item->>'lat', '')::double precision,
    nullif(item->>'lng', '')::double precision,
    item->>'geo_precision',
    nullif(item->>'deposit_pula', '')::integer,
    item->>'utilities_included',
    item->>'source_label',
    item->>'source_url',
    coalesce(nullif(item->>'fetched_at', '')::timestamptz, now()),
    coalesce(nullif(item->>'last_seen_at', '')::timestamptz, now())
  from (
    select distinct on (item->>'id') item
    from jsonb_array_elements(p_listings) as item
    where nullif(item->>'id', '') is not null
      and nullif(item->>'title', '') is not null
      and nullif(item->>'whatsapp_number', '') is not null
    order by item->>'id', coalesce(nullif(item->>'last_seen_at', '')::timestamptz, now()) desc
  ) as uniq
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    price = excluded.price,
    price_on_request = excluded.price_on_request,
    room_type = excluded.room_type,
    gender_preference = excluded.gender_preference,
    area = excluded.area,
    city = excluded.city,
    address = excluded.address,
    whatsapp_number = excluded.whatsapp_number,
    contact_name = excluded.contact_name,
    campus_ids = excluded.campus_ids,
    custom_university_name = excluded.custom_university_name,
    distance_to_campus = excluded.distance_to_campus,
    -- Never regress to fewer photos / amenities if a later crawl is thinner.
    amenities = case
      when cardinality(excluded.amenities) >= cardinality(w.amenities)
        then excluded.amenities else w.amenities end,
    photo_urls = case
      when cardinality(excluded.photo_urls) >= cardinality(w.photo_urls)
        then excluded.photo_urls else w.photo_urls end,
    lat = coalesce(excluded.lat, w.lat),
    lng = coalesce(excluded.lng, w.lng),
    geo_precision = coalesce(excluded.geo_precision, w.geo_precision),
    deposit_pula = coalesce(excluded.deposit_pula, w.deposit_pula),
    utilities_included = coalesce(excluded.utilities_included, w.utilities_included),
    source_label = excluded.source_label,
    source_url = excluded.source_url,
    last_seen_at = greatest(excluded.last_seen_at, w.last_seen_at),
    updated_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Drop listings no source has shown for 21 days.
create or replace function public.prune_web_rentals(p_keep_days integer default 21)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.web_rental_listings
  where last_seen_at < now() - make_interval(days => greatest(p_keep_days, 1));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.upsert_web_rentals(jsonb) from anon, authenticated;
revoke execute on function public.prune_web_rentals(integer) from anon, authenticated;

grant select on public.web_rental_listings to anon, authenticated;
