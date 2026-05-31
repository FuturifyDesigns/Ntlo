-- Do not bump updated_at for view counts or other non-content listing changes.
-- Run after 030_listing_updated_at_trigger.sql

create or replace function public.listing_content_changed(
  p_old public.listings,
  p_new public.listings
)
returns boolean language sql immutable as $$
  select
    public.listing_material_fields_changed(p_old, p_new)
    or p_old.title is distinct from p_new.title
    or p_old.description is distinct from p_new.description
    or p_old.house_rules is distinct from p_new.house_rules
    or p_old.whatsapp_number is distinct from p_new.whatsapp_number
    or p_old.verification_status is distinct from p_new.verification_status
    or p_old.verification_notes is distinct from p_new.verification_notes
    or p_old.is_verified is distinct from p_new.is_verified;
$$;

create or replace function public.touch_listing_updated_at()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if public.listing_content_changed(old, new) then
      new.updated_at := now();
    else
      new.updated_at := old.updated_at;
    end if;
  end if;
  return new;
end;
$$;
