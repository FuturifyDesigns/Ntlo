-- Public bucket for photos mirrored off classified sites.
-- Those hosts block hotlinking and rotate URLs, so galleries need local copies.
-- Run after 049_web_rental_sync.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'web-rental-photos',
  'web-rental-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Web rental photos are public" on storage.objects;
create policy "Web rental photos are public" on storage.objects
  for select using (bucket_id = 'web-rental-photos');

-- Writes come from the Edge Function via the service role, which bypasses RLS.
drop policy if exists "Web rental photos are service-written" on storage.objects;
create policy "Web rental photos are service-written" on storage.objects
  for insert with check (false);
