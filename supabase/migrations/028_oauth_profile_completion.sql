-- Allow first-time OAuth profile completion to set role, phone, and gender.
-- Run after 027_listing_publish_gate.sql

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
    if coalesce(new.verification_status, 'none') not in ('none', 'pending') then
      new.verification_status := 'none';
    end if;
    new.verification_notes := null;
    new.subscription_tier := coalesce(new.subscription_tier, 'early_access');
    new.subscription_status := coalesce(new.subscription_status, 'early_access');
    new.subscription_period_end := null;
    return new;
  end if;

  -- Initial profile setup (OAuth / social login): phone was empty, user may pick role + details.
  if coalesce(trim(old.phone), '') = '' then
    if new.role not in ('student', 'landlord') then
      new.role := 'student';
    end if;
    new.is_verified := false;
    new.is_banned := false;
    new.banned_at := null;
    new.banned_reason := null;
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

  new.role := old.role;
  new.is_verified := old.is_verified;
  new.is_banned := old.is_banned;
  new.banned_at := old.banned_at;
  new.banned_reason := old.banned_reason;
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
