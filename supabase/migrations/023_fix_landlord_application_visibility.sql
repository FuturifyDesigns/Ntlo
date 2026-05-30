-- Fix landlord visibility for listing applications.
-- Run after 022_withdraw_reasons_urgent_notifications.sql

-- Backfill landlord_id from listings (fixes rows where column drifted)
update public.listing_applications la
set landlord_id = l.landlord_id
from public.listings l
where la.listing_id = l.id
  and la.landlord_id is distinct from l.landlord_id;

-- Always derive landlord_id from the listing on write
create or replace function public.sync_listing_application_landlord()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select l.landlord_id into new.landlord_id
  from public.listings l
  where l.id = new.listing_id;

  if new.landlord_id is null then
    raise exception 'Listing not found for application';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_application_landlord on public.listing_applications;
create trigger trg_sync_application_landlord
  before insert or update on public.listing_applications
  for each row execute function public.sync_listing_application_landlord();

-- Landlords can read applications for listings they own (even if landlord_id was stale)
drop policy if exists "Parties read applications" on public.listing_applications;
create policy "Parties read applications" on public.listing_applications
  for select using (
    auth.uid() = student_id
    or auth.uid() = landlord_id
    or public.is_admin()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.landlord_id = auth.uid()
    )
  );

-- Students submit: landlord_id is set by trigger; only validate student + listing access
drop policy if exists "Students submit applications" on public.listing_applications;
create policy "Students submit applications" on public.listing_applications
  for insert with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.available = true
    )
  );

-- Landlords can update applications for their listings
drop policy if exists "Parties update applications" on public.listing_applications;
create policy "Parties update applications" on public.listing_applications
  for update using (
    auth.uid() = student_id
    or auth.uid() = landlord_id
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.landlord_id = auth.uid()
    )
  );
