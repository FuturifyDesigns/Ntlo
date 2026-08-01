-- External / off-platform listings (admin-imported from web sources).
-- No Facebook scraping — paste curated posts with contact details.
-- Run after 046_optional_verify_public_stats.sql

alter table public.listings
  add column if not exists listing_origin text not null default 'ntlo',
  add column if not exists external_contact_name text,
  add column if not exists external_source_label text,
  add column if not exists external_source_url text;

alter table public.listings drop constraint if exists listings_listing_origin_check;
alter table public.listings add constraint listings_listing_origin_check
  check (listing_origin in ('ntlo', 'external'));

comment on column public.listings.listing_origin is
  'ntlo = landlord-published on platform; external = admin-imported web/off-platform post';
comment on column public.listings.external_contact_name is
  'Display name for external listing contact (shown instead of landlord profile)';
comment on column public.listings.external_source_label is
  'Human label for where the post was found (e.g. Facebook group, Marketplace)';
comment on column public.listings.external_source_url is
  'Optional original post URL for admin reference';

-- Keep external contact names — do not overwrite with admin/landlord profile.
create or replace function public.sync_listing_landlord_display()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.listing_origin, 'ntlo') = 'external' then
    new.landlord_display_name := coalesce(
      nullif(trim(new.external_contact_name), ''),
      nullif(trim(new.landlord_display_name), ''),
      'Contact'
    );
    new.landlord_verified := false;
    return new;
  end if;

  if tg_op = 'INSERT' or new.landlord_id is distinct from coalesce(old.landlord_id, null) then
    select coalesce(full_name, 'Landlord'), coalesce(is_verified, false)
    into new.landlord_display_name, new.landlord_verified
    from public.profiles where id = new.landlord_id;
  end if;
  return new;
end;
$$;

create or replace function public.sync_listings_when_landlord_profile_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.listings
  set
    landlord_display_name = coalesce(new.full_name, 'Landlord'),
    landlord_verified = coalesce(new.is_verified, false)
  where landlord_id = new.id
    and coalesce(listing_origin, 'ntlo') <> 'external';
  return new;
end;
$$;

-- Admin imports an external listing (live immediately, WhatsApp-only contact path).
create or replace function public.admin_import_external_listing(
  p_title text,
  p_description text,
  p_price integer,
  p_room_type text,
  p_area text,
  p_city text,
  p_whatsapp_number text,
  p_contact_name text,
  p_photo_urls text[] default '{}',
  p_source_label text default null,
  p_source_url text default null,
  p_address text default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_nearest_university_id integer default null,
  p_custom_university_name text default null,
  p_gender_preference text default 'any',
  p_amenities text[] default '{}',
  p_distance_to_campus double precision default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_contact text;
  v_wa text;
  v_i int;
  v_url text;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ONLY: Only admins can import external listings';
  end if;

  v_contact := nullif(trim(coalesce(p_contact_name, '')), '');
  if v_contact is null then
    raise exception 'CONTACT_REQUIRED: Contact name is required for external listings';
  end if;

  v_wa := nullif(trim(coalesce(p_whatsapp_number, '')), '');
  if v_wa is null then
    raise exception 'WHATSAPP_REQUIRED: WhatsApp / phone is required for external listings';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception 'TITLE_REQUIRED: Title is required';
  end if;

  if p_price is null or p_price < 0 then
    raise exception 'PRICE_INVALID: Price must be a non-negative integer';
  end if;

  if coalesce(p_room_type, '') not in ('single', 'sharing', 'self_contained', 'cottage', 'house') then
    raise exception 'ROOM_TYPE_INVALID: Invalid room type';
  end if;

  insert into public.listings (
    landlord_id,
    title,
    description,
    price,
    room_type,
    gender_preference,
    address,
    area,
    city,
    lat,
    lng,
    nearest_university_id,
    custom_university_name,
    distance_to_campus,
    amenities,
    whatsapp_number,
    available,
    occupancy_status,
    verification_status,
    is_verified,
    landlord_verified,
    landlord_display_name,
    listing_origin,
    external_contact_name,
    external_source_label,
    external_source_url
  ) values (
    auth.uid(),
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_price,
    p_room_type,
    coalesce(nullif(trim(p_gender_preference), ''), 'any'),
    coalesce(nullif(trim(p_address), ''), nullif(trim(p_area), ''), trim(p_city)),
    coalesce(nullif(trim(p_area), ''), trim(p_city)),
    trim(p_city),
    p_lat,
    p_lng,
    p_nearest_university_id,
    nullif(trim(coalesce(p_custom_university_name, '')), ''),
    p_distance_to_campus,
    coalesce(p_amenities, '{}'),
    v_wa,
    true,
    'available',
    'approved',
    false,
    false,
    v_contact,
    'external',
    v_contact,
    nullif(trim(coalesce(p_source_label, '')), ''),
    nullif(trim(coalesce(p_source_url, '')), '')
  )
  returning id into v_id;

  if p_photo_urls is not null and cardinality(p_photo_urls) > 0 then
    v_i := 0;
    foreach v_url in array p_photo_urls loop
      if nullif(trim(v_url), '') is not null then
        insert into public.listing_photos (listing_id, url, is_cover, display_order)
        values (v_id, trim(v_url), v_i = 0, v_i);
        v_i := v_i + 1;
      end if;
    end loop;
  end if;

  return v_id;
end;
$$;

grant execute on function public.admin_import_external_listing(
  text, text, integer, text, text, text, text, text, text[], text, text,
  text, double precision, double precision, integer, text, text, text[], double precision
) to authenticated;
