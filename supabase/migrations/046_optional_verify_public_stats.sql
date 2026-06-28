-- Optional landlord verification skip + secure public platform counts (no PII).

alter table public.profiles
  add column if not exists verification_deferred_at timestamptz;

comment on column public.profiles.verification_deferred_at is
  'Landlord chose to skip ID verification for now; can list with higher-risk badge until approved.';

-- Aggregate counts only — no emails, phones, or row data exposed.
create or replace function public.get_public_platform_stats()
returns json
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select json_build_object(
    'students', (
      select count(*)::int
      from public.profiles
      where role = 'student'
    ),
    'landlords', (
      select count(*)::int
      from public.profiles
      where role = 'landlord'
    ),
    'listings', (
      select count(*)::int
      from public.listings
      where verification_status = 'approved'
        and occupancy_status in ('available', 'rented')
    ),
    'campuses_with_listings', (
      select count(*)::int
      from (
        select distinct coalesce(
          nearest_university_id::text,
          lower(trim(custom_university_name))
        ) as campus_key
        from public.listings
        where verification_status = 'approved'
          and occupancy_status in ('available', 'rented')
          and (
            nearest_university_id is not null
            or nullif(trim(custom_university_name), '') is not null
          )
      ) campuses
    )
  );
$$;

grant execute on function public.get_public_platform_stats() to anon, authenticated;

-- Landlord skips verification for now (can still list; students see higher-risk badge).
create or replace function public.skip_landlord_verification()
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_rows int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
  set verification_deferred_at = now()
  where id = auth.uid()
    and role = 'landlord'
    and coalesce(is_verified, false) = false
    and coalesce(verification_status, 'none') in ('none', 'rejected');

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Cannot skip verification in current status';
  end if;
end;
$$;

grant execute on function public.skip_landlord_verification() to authenticated;
