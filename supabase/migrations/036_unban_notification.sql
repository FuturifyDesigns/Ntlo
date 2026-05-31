-- Notify users when an admin lifts their ban.
-- Run after 035_ban_acknowledgment_login_gate.sql

create or replace function public.admin_unban_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  select role into v_role from public.profiles where id = target_id;
  if v_role is null then
    raise exception 'User not found';
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

  perform public.notify_user(
    target_id,
    'account_unbanned',
    'Welcome back to Ntlo',
    'Your account suspension has been lifted. You can sign in and use Ntlo again.'
      || E'\n\n'
      || 'Please follow our community guidelines. Further violations may result in another suspension or a permanent ban.',
    case when v_role = 'landlord' then '/landlord' else '/student' end,
    target_id,
    true
  );
end;
$$;

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
    'account_banned', 'account_unbanned'
  ));
