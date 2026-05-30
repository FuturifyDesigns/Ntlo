-- Listing views: count everyone except the listing owner viewing their own listing.
-- Run after 017_application_id_docs.sql

create or replace function public.increment_listing_view(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
begin
  select landlord_id into v_landlord_id
  from public.listings
  where id = p_listing_id;

  if v_landlord_id is null then
    return;
  end if;

  -- Owner previewing their own listing does not count as a view.
  if auth.uid() is not null and auth.uid() = v_landlord_id then
    return;
  end if;

  update public.listings
  set views = coalesce(views, 0) + 1
  where id = p_listing_id;
end;
$$;

grant execute on function public.increment_listing_view(uuid) to anon;
grant execute on function public.increment_listing_view(uuid) to authenticated;
