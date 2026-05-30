-- Optional listing details: house rules, deposit, utilities
alter table public.listings add column if not exists house_rules text;
alter table public.listings add column if not exists deposit_pula integer;
alter table public.listings add column if not exists utilities_included text;

alter table public.listings drop constraint if exists listings_utilities_included_check;
alter table public.listings add constraint listings_utilities_included_check
  check (utilities_included is null or utilities_included in ('included', 'not_included', 'partial'));
