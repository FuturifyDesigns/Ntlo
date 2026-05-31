-- Timed/permanent bans, user acknowledgment, login guard, improved delete.
-- Run after 033_admin_university_crud.sql

alter table public.profiles add column if not exists banned_until timestamptz;
alter table public.profiles add column if not exists ban_reason_code text;
alter table public.profiles add column if not exists ban_reason_note text;
alter table public.profiles add column if not exists ban_acknowledged_at timestamptz;

-- ── Ban helpers ──

create or replace function public.is_ban_active(
  p_is_banned boolean,
  p_banned_until timestamptz
)
returns boolean
language sql
stable
as $$
  select coalesce(p_is_banned, false)
    and (p_banned_until is null or p_banned_until > now());
$$;

create or replace function public.clear_expired_ban(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    is_banned = false,
    banned_at = null,
    banned_reason = null,
    banned_until = null,
    ban_reason_code = null,
    ban_reason_note = null,
    ban_acknowledged_at = null
  where id = p_user_id
    and coalesce(is_banned, false)
    and banned_until is not null
    and banned_until <= now();
end;
$$;

create or replace function public.sync_profile_ban_status(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  perform public.clear_expired_ban(p_user_id);
  select * into v_row from public.profiles where id = p_user_id;
  return v_row;
end;
$$;

create or replace function public.check_account_access(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  if p_user_id is null then
    return jsonb_build_object('allowed', false);
  end if;

  select * into v_row from public.sync_profile_ban_status(p_user_id);
  if v_row.id is null then
    return jsonb_build_object('allowed', false);
  end if;

  if public.is_ban_active(v_row.is_banned, v_row.banned_until) then
    return jsonb_build_object(
      'allowed', false,
      'ban', jsonb_build_object(
        'reason_code', v_row.ban_reason_code,
        'reason_note', v_row.ban_reason_note,
        'banned_reason', v_row.banned_reason,
        'banned_at', v_row.banned_at,
        'banned_until', v_row.banned_until,
        'permanent', v_row.banned_until is null,
        'acknowledged', v_row.ban_acknowledged_at is not null
      )
    );
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;

create or replace function public.acknowledge_account_ban()
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
  set ban_acknowledged_at = now()
  where id = auth.uid()
    and public.is_ban_active(is_banned, banned_until);

  if not found then
    raise exception 'No active ban to acknowledge';
  end if;
end;
$$;

-- ── Admin ban / unban ──

create or replace function public.admin_ban_user(
  target_id uuid,
  p_duration_type text,
  p_duration_amount integer default null,
  p_reason_code text default null,
  p_reason_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_role text;
  v_until timestamptz;
  v_summary text;
  v_body text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if target_id = auth.uid() then
    raise exception 'Cannot ban yourself';
  end if;

  select role into v_target_role from public.profiles where id = target_id;
  if v_target_role is null then
    raise exception 'User not found';
  end if;
  if v_target_role = 'admin' then
    raise exception 'Cannot ban an admin account';
  end if;

  if p_duration_type not in ('hours', 'days', 'permanent') then
    raise exception 'Invalid ban duration type';
  end if;

  if p_duration_type = 'permanent' then
    v_until := null;
  elsif p_duration_type = 'hours' then
    if p_duration_amount is null or p_duration_amount < 1 or p_duration_amount > 8760 then
      raise exception 'Ban hours must be between 1 and 8760';
    end if;
    v_until := now() + make_interval(hours => p_duration_amount);
  else
    if p_duration_amount is null or p_duration_amount < 1 or p_duration_amount > 365 then
      raise exception 'Ban days must be between 1 and 365';
    end if;
    v_until := now() + make_interval(days => p_duration_amount);
  end if;

  if p_reason_code is null or p_reason_code not in (
    'terms_violation', 'harassment', 'fraud_scam', 'fake_documents', 'spam_abuse', 'other'
  ) then
    raise exception 'Invalid ban reason';
  end if;

  v_summary := case p_reason_code
    when 'terms_violation' then 'Terms of service violation'
    when 'harassment' then 'Harassment or abusive behaviour'
    when 'fraud_scam' then 'Fraud or scam activity'
    when 'fake_documents' then 'Fake or misleading documents'
    when 'spam_abuse' then 'Spam or platform abuse'
    else 'Policy violation'
  end;

  v_body := v_summary;
  if coalesce(trim(p_reason_note), '') <> '' then
    v_body := v_body || E'\n\n' || trim(p_reason_note);
  end if;
  if p_duration_type = 'permanent' then
    v_body := v_body || E'\n\nDuration: Permanent';
  elsif p_duration_type = 'hours' then
    v_body := v_body || E'\n\nDuration: ' || p_duration_amount || ' hour(s)';
  else
    v_body := v_body || E'\n\nDuration: ' || p_duration_amount || ' day(s)';
  end if;
  if v_until is not null then
    v_body := v_body || E'\nEnds: ' || to_char(v_until at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC';
  end if;

  update public.profiles
  set
    is_banned = true,
    banned_at = now(),
    banned_reason = v_body,
    banned_until = v_until,
    ban_reason_code = p_reason_code,
    ban_reason_note = nullif(trim(p_reason_note), ''),
    ban_acknowledged_at = null
  where id = target_id;

  perform public.notify_user(
    target_id,
    'account_banned',
    'Your Ntlo account has been suspended',
    v_body,
    '/login?banned=1',
    target_id,
    true
  );
end;
$$;

create or replace function public.admin_unban_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  update public.profiles
  set
    is_banned = false,
    banned_at = null,
    banned_reason = null,
    banned_until = null,
    ban_reason_code = null,
    ban_reason_note = null,
    ban_acknowledged_at = null
  where id = target_id;

  if not found then
    raise exception 'User not found';
  end if;
end;
$$;

-- Backward-compatible wrapper
create or replace function public.admin_set_ban(
  target_id uuid,
  banned boolean,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not banned then
    perform public.admin_unban_user(target_id);
    return;
  end if;

  perform public.admin_ban_user(
    target_id,
    'permanent',
    null,
    'other',
    coalesce(nullif(trim(reason), ''), 'Suspended by admin')
  );
end;
$$;

-- ── Improved delete ──

create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if target_id = auth.uid() then
    raise exception 'Cannot delete yourself';
  end if;

  select role into v_role from public.profiles where id = target_id;
  if v_role is null then
    raise exception 'User not found';
  end if;
  if v_role = 'admin' then
    raise exception 'Cannot delete an admin account';
  end if;

  delete from auth.users where id = target_id;

  if not found then
    raise exception 'Could not delete user account';
  end if;
end;
$$;

-- ── Protect ban fields on self-service profile updates ──

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

  -- Allow acknowledging an active ban once
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

-- ── Notification type ──
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'message',
    'viewing_request', 'viewing_confirmed', 'viewing_declined', 'viewing_cancelled',
    'application_submitted', 'application_accepted', 'application_rejected',
    'application_withdrawn', 'application_changes_requested',
    'listing_submitted', 'listing_approved', 'listing_rejected', 'listing_changes_requested',
    'admin_listing_review', 'admin_listing_removed',
    'review_posted', 'admin_application', 'admin_review', 'admin_verification',
    'account_banned'
  ));

grant execute on function public.clear_expired_ban(uuid) to authenticated;
grant execute on function public.sync_profile_ban_status(uuid) to authenticated;
grant execute on function public.check_account_access(uuid) to authenticated;
grant execute on function public.acknowledge_account_ban() to authenticated;
grant execute on function public.admin_ban_user(uuid, text, integer, text, text) to authenticated;
grant execute on function public.admin_unban_user(uuid) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
