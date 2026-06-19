-- Decouple publish approval from Trusted home badge.
-- verification_status = approved → live on Ntlo (moderate baseline)
-- is_verified = true → Trusted home badge (admin awards separately)

create or replace function public.admin_review_listing(
  target_listing_id uuid,
  approved boolean,
  notes text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_landlord uuid;
  v_title text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  if approved and not public.verification_latest_docs_all_approved(p_listing_id := target_listing_id) then
    raise exception 'All documents must be marked OK before approving';
  end if;

  select landlord_id, title into v_landlord, v_title
  from public.listings where id = target_listing_id;

  update public.listings
  set
    verification_status = case when approved then 'approved' else 'rejected' end,
    is_verified = false,
    verification_notes = notes
  where id = target_listing_id;

  update public.verification_documents
  set
    status = case when approved then 'approved' else 'rejected' end,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = notes
  where listing_id = target_listing_id and status in ('pending', 'changes_requested');

  if v_landlord is not null then
    perform public.notify_user(
      v_landlord,
      case when approved then 'listing_approved' else 'listing_rejected' end,
      case when approved then 'Listing approved' else 'Listing not approved' end,
      coalesce(v_title, 'Your listing'),
      '/landlord',
      target_listing_id,
      true
    );
  end if;
end;
$$;

create or replace function public.admin_set_listing_trust(
  p_listing_id uuid,
  trusted boolean,
  notes text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_landlord uuid;
  v_title text;
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  select landlord_id, title, verification_status
  into v_landlord, v_title, v_status
  from public.listings
  where id = p_listing_id;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_status <> 'approved' then
    raise exception 'Only live listings can receive a trust badge';
  end if;

  update public.listings
  set
    is_verified = trusted,
    verification_notes = coalesce(notes, verification_notes)
  where id = p_listing_id;

  if v_landlord is not null then
    perform public.notify_user(
      v_landlord,
      case when trusted then 'listing_trusted' else 'listing_trust_removed' end,
      case when trusted then 'Trusted home badge awarded' else 'Trusted home badge removed' end,
      coalesce(v_title, 'Your listing'),
      '/landlord',
      p_listing_id,
      true
    );
  end if;
end;
$$;

grant execute on function public.admin_set_listing_trust(uuid, boolean, text) to authenticated;

-- Existing live listings were auto-marked trusted; reset so admins can award selectively.
update public.listings
set is_verified = false
where verification_status = 'approved'
  and is_verified = true;
