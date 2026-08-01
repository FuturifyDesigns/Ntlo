-- Optional: backfill nearest_university_id on imported external listings
-- that were saved without a campus. Safe to re-run.
-- Paste in Supabase SQL editor after reviewing the mappings.

-- Ledumadumane → BUAN (8)
update public.listings
set nearest_university_id = 8
where listing_origin = 'external'
  and nearest_university_id is null
  and whatsapp_number like '%71746344%';

-- BAC walkable → BAC (9)
update public.listings
set nearest_university_id = 9
where listing_origin = 'external'
  and nearest_university_id is null
  and whatsapp_number like '%76325612%';

-- Botho / Enco Block 7 → Botho (3)
update public.listings
set nearest_university_id = 3
where listing_origin = 'external'
  and nearest_university_id is null
  and (
    whatsapp_number like '%72900189%'
    or title ilike '%botho%'
  );

-- Default remaining Gaborone student externals → UB (1)
update public.listings
set nearest_university_id = 1
where listing_origin = 'external'
  and nearest_university_id is null
  and (
    city ilike '%gaborone%'
    or area ilike '%block%'
    or area ilike '%broadhurst%'
    or area ilike '%phase%'
    or area ilike '%mogoditshane%'
    or title ilike '%ub%'
    or title ilike '%student%'
  );
