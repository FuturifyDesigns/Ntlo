-- Allow login when banned but not yet acknowledged; block only after confirm.
-- Run after 034_user_ban_system.sql

create or replace function public.check_account_access(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
  v_ban jsonb;
begin
  if p_user_id is null then
    return jsonb_build_object('allowed', false);
  end if;

  select * into v_row from public.sync_profile_ban_status(p_user_id);
  if v_row.id is null then
    return jsonb_build_object('allowed', false);
  end if;

  if public.is_ban_active(v_row.is_banned, v_row.banned_until) then
    v_ban := jsonb_build_object(
      'reason_code', v_row.ban_reason_code,
      'reason_note', v_row.ban_reason_note,
      'banned_reason', v_row.banned_reason,
      'banned_at', v_row.banned_at,
      'banned_until', v_row.banned_until,
      'permanent', v_row.banned_until is null,
      'acknowledged', v_row.ban_acknowledged_at is not null
    );

    -- First sign-in after ban: allow session so user can see and confirm the modal.
    if v_row.ban_acknowledged_at is null then
      return jsonb_build_object('allowed', true, 'pending_ban', v_ban);
    end if;

    return jsonb_build_object('allowed', false, 'ban', v_ban);
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;
