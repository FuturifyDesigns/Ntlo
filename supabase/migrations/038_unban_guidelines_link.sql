-- Point unban notifications at community guidelines instead of the dashboard.
-- Run after 037_admin_delete_listing.sql

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
    '/guidelines',
    target_id,
    true
  );
end;
$$;
