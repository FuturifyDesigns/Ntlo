-- Seed public web rentals (classifieds) as external listings.
-- Safe to re-run: skips rows that already match the same WhatsApp + title.
-- Run after 047_external_listings.sql

-- Ensure external columns exist (no-op if 047 already applied)
alter table public.listings
  add column if not exists listing_origin text not null default 'ntlo',
  add column if not exists external_contact_name text,
  add column if not exists external_source_label text,
  add column if not exists external_source_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_listing_origin_check'
  ) then
    alter table public.listings
      add constraint listings_listing_origin_check
      check (listing_origin in ('ntlo', 'external'));
  end if;
end $$;

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

create or replace function public.seed_web_rentals(p_token text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid;
  v_count int := 0;
  r record;
begin
  if p_token is distinct from 'ntlo-seed-web-2026' then
    raise exception 'INVALID_TOKEN';
  end if;

  select id into v_admin
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;

  if v_admin is null then
    raise exception 'NO_ADMIN: Create an admin profile first';
  end if;

  for r in
    select * from (values
      (
        'Room share near Pula Spar, Ledumadumane',
        'Room to share in Ledumadumane near Pula Spar. Rent P1,330 including water and electricity. Security deposit P1,100. Confirm availability on WhatsApp.',
        1330, 'sharing', 'any', 'Ledumadumane', 'Gaborone', 'Ledumadumane near Pula Spar',
        '26771746344', 'Elsa', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array['wifi']::text[]
      ),
      (
        '2.5 room share — Block 6 behind Bonnington',
        'Second-and-half to share in Block 6, Gaborone, behind Bonnington Junior School. Walled yard. Rent P1,250 + P1,250 security. Finder''s fee P250. Viewing available.',
        1250, 'sharing', 'any', 'Block 6', 'Gaborone', 'Block 6 behind Bonnington Junior School',
        '26772351501', 'Aubrey', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array[]::text[]
      ),
      (
        'House share Block 7 near Botho / Enco',
        'Share a house in Gaborone Block 7 next to Enco / Botho area. Your share P2,000 + P1,000 security. Confirm rooms still open before visiting.',
        2000, 'sharing', 'any', 'Block 7', 'Gaborone', 'Block 7 near Enco',
        '26772900189', 'Appeal', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array[]::text[]
      ),
      (
        'Shared room Block 5 — student friendly',
        'Looking for an individual or students (two females or two males) to share a room in Block 5. Two single beds. Rent P1,400. Finder''s fee P300.',
        1400, 'sharing', 'any', 'Block 5', 'Gaborone', 'Block 5',
        '26771557655', 'Frank', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array[]::text[]
      ),
      (
        'Room share Block 5 (alt contact)',
        'Shared room in Block 5 with two single beds. Rent P1,400. Finder''s fee P300. Second contact number listed on the original post.',
        1400, 'sharing', 'any', 'Block 5', 'Gaborone', 'Block 5',
        '26774819458', 'Botswana', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array[]::text[]
      ),
      (
        'Room in 3-bed house — New Canada',
        'Room available in a 3-bedroom BHC house at New Canada. Walled, air con (not fitted). Rent P1,500. Ask about move-in date on WhatsApp.',
        1500, 'sharing', 'any', 'New Canada', 'Gaborone', 'New Canada',
        '26776001754', 'Boineelo', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array['ac']::text[]
      ),
      (
        'Air-conditioned room — 3-bed house',
        'Air-conditioned room in a 3-bedroom house. Tiled and fitted. Paved yard, electric fence, fitted kitchen, geyser, shower and bathtub. Rent P1,600 + P750 security.',
        1600, 'sharing', 'any', 'Gaborone', 'Gaborone', 'Gaborone',
        '26773458500', 'Mpho', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array['ac','security','hot_water']::text[]
      ),
      (
        '2-bed share — Mogoditshane by Tsabong robots',
        'Two-bedroom apartment to share in Mogoditshane by Tsabong robots. Your share P1,750 + equivalent security. Confirm move-in timing with contact.',
        1750, 'sharing', 'any', 'Mogoditshane', 'Gaborone', 'Mogoditshane by Tsabong robots',
        '26774247384', 'Kristie', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array[]::text[]
      ),
      (
        'Room in 4-bed house — Phase 2 near BTC',
        'Room in a 4-bedroom house in Phase 2 near BTC. Two people share bathroom; shared kitchen and sitting room. Available now.',
        1300, 'sharing', 'any', 'Phase 2', 'Gaborone', 'Phase 2 near BTC',
        '26771487257', 'Pauline', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array[]::text[]
      ),
      (
        'Broadhurst Ext 27 — room near KBL',
        'Single room / servant''s quarters Broadhurst Ext 27 near KBL brewery and Sefalana. Rent P1,300 includes water and electricity. Extra P400 if sharing with a partner. WhatsApp for viewing.',
        1300, 'single', 'any', 'Broadhurst Ext 27', 'Gaborone', 'Broadhurst Ext 27 near KBL',
        '26776104760', 'Joseph', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array['wifi']::text[]
      ),
      (
        'Broadhurst Ext 27 — room (alt contact)',
        'Servant''s quarters Broadhurst Ext 27 near KBL and Park 27. P1,300 includes water and power. Master bedroom in main house also listed around P1,800. WhatsApp for viewing.',
        1300, 'single', 'any', 'Broadhurst Ext 27', 'Gaborone', 'Broadhurst Ext 27',
        '26778439391', 'Fearles', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array[]::text[]
      ),
      (
        'House share Gabane — near primary / Route 3',
        '3-bedroom house to share in Gabane near Gabane Primary, 2 mins walk to Route 3. Fitted kitchen, wall wardrobe, boundary wall with electric fence and motorized gate. P1,000 per room.',
        1000, 'sharing', 'any', 'Gabane', 'Gabane', 'Gabane near Gabane Primary',
        '26771817707', 'Hero', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array['security']::text[]
      ),
      (
        '2-bed share Gabane — secure yard',
        '2-bedroom house to share in a safe, spacious & secure yard in Gabane. Spare room with free wardrobe & curtains. Single person preferred. Share kitchen & bathroom, hot water. Near Gabane routes 1 & 3. Share P900.',
        900, 'sharing', 'any', 'Gabane', 'Gabane', 'Gabane',
        '26774215618', 'Car', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array['hot_water']::text[]
      ),
      (
        'Walkable to BAC — room share',
        'Room share walkable to BAC. Your share P600 + equivalent security (payable over 2–3 months). Confirm details and availability on WhatsApp.',
        600, 'sharing', 'any', 'Gaborone', 'Gaborone', 'Near BAC',
        '26776325612', 'Tlamelo', 'ZimCompass classifieds', 'https://bw.zimcompass.com/house-share',
        array[]::text[]
      ),
      (
        'Rich Minds Student Accommodation — Block 8',
        'Student accommodation in Block 8, Gaborone. Walking distance to New Era College; on route to UB, Botho and BaIsago. Free Wi-Fi. Double sharing rooms. Listed rent about P1,000/mo — confirm current rate and availability with the contact on the original listing site.',
        1000, 'sharing', 'any', 'Block 8', 'Gaborone', 'Block 8, Gaborone',
        '26771000000', 'Rich Minds', 'Ezilet', 'https://ezilet.net/listing/rich-minds-student-accommodation/',
        array['wifi']::text[]
      ),
      (
        'TT Student House — Francistown / Molapo',
        'Student house in Molapo, Francistown near UB Francistown and Clifton College. Double sharing, free Wi-Fi, shuttle transport, cleaning. Listed around P5,000/mo — confirm price and WhatsApp contact on Ezilet before paying anything.',
        5000, 'sharing', 'any', 'Molapo', 'Francistown', 'plot 20413, Molapo, Francistown',
        '26771000001', 'TT Student House', 'Ezilet', 'https://ezilet.net/listing/tt-student-house-accommodation/',
        array['wifi']::text[]
      ),
      (
        'Mohammed Ext 10 — female student housing near UB',
        'Female-only student accommodation opposite University of Botswana (about 2 minutes walk). Shared rooms, free Wi-Fi. Contact details via original Ezilet listing — confirm rent and availability before visiting.',
        1500, 'sharing', 'female', 'Extension 10', 'Gaborone', 'Extension 10, Gaborone',
        '26771000002', 'Mohammed Ext 10', 'Ezilet', 'https://ezilet.net/listing/mohammed-ext-10-student-accommodation/',
        array['wifi']::text[]
      ),
      (
        'Tulo Student Residence — Block 7 (female)',
        'Female-only furnished 1-bedroom apartments in Block 7, Gaborone. Short walk to Limkokwing. 24-hour security and free Wi-Fi. Price on application — message via original listing to confirm.',
        2000, 'self_contained', 'female', 'Block 7', 'Gaborone', 'Block 7, Gaborone',
        '26771000003', 'Tulo Student Residence', 'Ezilet', 'https://ezilet.net/listing/tulo-student-residence/',
        array['wifi','security']::text[]
      )
    ) as t(
      title, description, price, room_type, gender_preference, area, city, address,
      whatsapp_number, contact_name, source_label, source_url, amenities
    )
  loop
    if exists (
      select 1 from public.listings
      where listing_origin = 'external'
        and whatsapp_number = r.whatsapp_number
        and title = r.title
    ) then
      continue;
    end if;

    -- Skip placeholder Ezilet numbers that are not real contacts
    if r.whatsapp_number in ('26771000000', '26771000001', '26771000002', '26771000003') then
      continue;
    end if;

    insert into public.listings (
      landlord_id, title, description, price, room_type, gender_preference,
      address, area, city, amenities, whatsapp_number, available, occupancy_status,
      verification_status, is_verified, landlord_verified, landlord_display_name,
      listing_origin, external_contact_name, external_source_label, external_source_url
    ) values (
      v_admin, r.title, r.description, r.price, r.room_type, r.gender_preference,
      r.address, r.area, r.city, r.amenities, r.whatsapp_number, true, 'available',
      'approved', false, false, r.contact_name,
      'external', r.contact_name, r.source_label, r.source_url
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.seed_web_rentals(text) to anon, authenticated;

-- Auto-run once when migration is applied in SQL editor / CI
select public.seed_web_rentals('ntlo-seed-web-2026');
