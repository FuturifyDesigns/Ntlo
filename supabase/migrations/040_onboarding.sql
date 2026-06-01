-- First-time dashboard onboarding completion flag.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

-- Skip forced onboarding for accounts that existed before this feature.
update public.profiles
set onboarding_completed_at = now()
where onboarding_completed_at is null;

create or replace function public.complete_onboarding()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
  set onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where id = auth.uid();
end;
$$;

grant execute on function public.complete_onboarding() to authenticated;

-- Lock onboarding flag from client-side profile updates.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role not in ('student', 'landlord') then
      new.role := 'student';
    end if;
    new.is_verified := false;
    new.is_banned := false;
    new.banned_at := null;
    new.banned_reason := null;
    new.banned_until := null;
    new.ban_reason_code := null;
    new.ban_reason_note := null;
    new.ban_acknowledged_at := null;
    new.onboarding_completed_at := null;
    if coalesce(new.verification_status, 'none') not in ('none', 'pending') then
      new.verification_status := 'none';
    end if;
    new.verification_notes := null;
    new.subscription_tier := coalesce(new.subscription_tier, 'early_access');
    new.subscription_status := coalesce(new.subscription_status, 'early_access');
    new.subscription_period_end := null;
    return new;
  end if;

  if coalesce(trim(old.phone), '') = '' then
    if new.role not in ('student', 'landlord') then
      new.role := 'student';
    end if;
    new.is_verified := false;
    new.is_banned := false;
    new.banned_at := null;
    new.banned_reason := null;
    new.banned_until := null;
    new.ban_reason_code := null;
    new.ban_reason_note := null;
    new.ban_acknowledged_at := null;
    new.onboarding_completed_at := old.onboarding_completed_at;
    new.verification_notes := null;
    new.subscription_tier := old.subscription_tier;
    new.subscription_status := old.subscription_status;
    new.subscription_period_end := old.subscription_period_end;
    if new.verification_status is distinct from old.verification_status then
      if not (new.verification_status = 'pending'
              and old.verification_status in ('none', 'rejected', 'changes_requested')) then
        new.verification_status := old.verification_status;
      end if;
    end if;
    return new;
  end if;

  if public.is_ban_active(old.is_banned, old.banned_until)
     and old.ban_acknowledged_at is null
     and new.ban_acknowledged_at is not null
     and new.is_banned is not distinct from old.is_banned
     and new.banned_until is not distinct from old.banned_until
     and new.ban_reason_code is not distinct from old.ban_reason_code
     and new.ban_reason_note is not distinct from old.ban_reason_note
     and new.banned_reason is not distinct from old.banned_reason then
    new.role := old.role;
    new.is_verified := old.is_verified;
    new.banned_at := old.banned_at;
    new.onboarding_completed_at := old.onboarding_completed_at;
    return new;
  end if;

  new.role := old.role;
  new.is_verified := old.is_verified;
  new.is_banned := old.is_banned;
  new.banned_at := old.banned_at;
  new.banned_reason := old.banned_reason;
  new.banned_until := old.banned_until;
  new.ban_reason_code := old.ban_reason_code;
  new.ban_reason_note := old.ban_reason_note;
  new.ban_acknowledged_at := old.ban_acknowledged_at;
  new.onboarding_completed_at := old.onboarding_completed_at;
  new.verification_notes := old.verification_notes;
  new.subscription_tier := old.subscription_tier;
  new.subscription_status := old.subscription_status;
  new.subscription_period_end := old.subscription_period_end;

  if new.verification_status is distinct from old.verification_status then
    if not (new.verification_status = 'pending'
            and old.verification_status in ('none', 'rejected', 'changes_requested')) then
      new.verification_status := old.verification_status;
    end if;
  end if;

  return new;
end;
$$;
