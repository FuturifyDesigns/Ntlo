-- Auto-touch updated_at on listing changes (landlord edits, admin, RPC).
-- Run after 029_listing_review_occupancy_guard.sql

create or replace function public.touch_listing_updated_at()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_touch_listing_updated_at on public.listings;
create trigger trg_touch_listing_updated_at
  before update on public.listings
  for each row execute function public.touch_listing_updated_at();
