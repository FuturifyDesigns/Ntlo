-- Withdrawal reasons, both-party viewing cancel, urgent notifications, resubmit alerts.
-- Run after 021_notifications_presence_reviews.sql

-- ── Withdrawal reason fields ──
alter table public.listing_applications
  add column if not exists withdraw_reason_code text,
  add column if not exists withdraw_reason_note text;

alter table public.viewing_requests
  add column if not exists cancel_reason_code text,
  add column if not exists cancel_reason_note text,
  add column if not exists cancelled_by uuid references public.profiles(id);

-- ── Urgent flag on notifications ──
alter table public.notifications
  add column if not exists is_urgent boolean not null default false;

-- ── notify_user with urgency ──
create or replace function public.notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_entity_id uuid default null,
  p_is_urgent boolean default false
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then return; end if;
  insert into public.notifications (user_id, type, title, body, link, entity_id, is_urgent)
  values (p_user_id, p_type, p_title, p_body, p_link, p_entity_id, coalesce(p_is_urgent, false));
end;
$$;

create or replace function public.notify_admins(
  p_type text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_entity_id uuid default null,
  p_is_urgent boolean default false
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link, entity_id, is_urgent)
  select id, p_type, p_title, p_body, p_link, p_entity_id, coalesce(p_is_urgent, false)
  from public.profiles where role = 'admin';
end;
$$;

-- ── Application withdraw with reason (student) ──
drop function if exists public.withdraw_application(uuid);
create or replace function public.withdraw_application(
  p_application_id uuid,
  p_reason_code text,
  p_reason_note text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_reason_code is null or p_reason_code not in (
    'found_other_room', 'plans_changed', 'listing_not_suitable', 'other'
  ) then
    raise exception 'Invalid withdrawal reason';
  end if;

  update public.listing_applications
  set
    status = 'withdrawn',
    withdraw_reason_code = p_reason_code,
    withdraw_reason_note = nullif(trim(p_reason_note), ''),
    updated_at = now()
  where id = p_application_id
    and student_id = auth.uid()
    and status in ('submitted', 'under_review');

  if not found then raise exception 'Cannot withdraw this application'; end if;
end;
$$;

grant execute on function public.withdraw_application(uuid, text, text) to authenticated;

-- ── Viewing cancel — student or landlord, pending or confirmed ──
drop function if exists public.cancel_viewing_request(uuid);
create or replace function public.cancel_viewing_request(
  p_viewing_id uuid,
  p_reason_code text,
  p_reason_note text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_row public.viewing_requests%rowtype;
begin
  if p_reason_code is null or p_reason_code not in (
    'schedule_conflict', 'found_alternative', 'no_longer_available', 'other'
  ) then
    raise exception 'Invalid cancellation reason';
  end if;

  select * into v_row from public.viewing_requests where id = p_viewing_id;
  if not found then raise exception 'Viewing request not found'; end if;

  if auth.uid() not in (v_row.student_id, v_row.landlord_id) then
    raise exception 'Not allowed';
  end if;

  if v_row.status not in ('pending', 'confirmed') then
    raise exception 'This viewing can no longer be cancelled';
  end if;

  update public.viewing_requests
  set
    status = 'cancelled',
    cancel_reason_code = p_reason_code,
    cancel_reason_note = nullif(trim(p_reason_note), ''),
    cancelled_by = auth.uid(),
    updated_at = now()
  where id = p_viewing_id;
end;
$$;

grant execute on function public.cancel_viewing_request(uuid, text, text) to authenticated;

-- ── Message notifications (urgent) ──
create or replace function public.trg_notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_conv public.conversations%rowtype;
  v_recipient uuid;
  v_listing_title text;
begin
  select * into v_conv from public.conversations where id = new.conversation_id;
  if not found then return new; end if;

  select title into v_listing_title from public.listings where id = v_conv.listing_id;

  if new.sender_id = v_conv.student_id then
    v_recipient := v_conv.landlord_id;
  else
    v_recipient := v_conv.student_id;
  end if;

  perform public.notify_user(
    v_recipient,
    'message',
    coalesce('New message about ' || v_listing_title, 'New message'),
    left(trim(new.body), 200),
    case
      when v_recipient = v_conv.landlord_id then '/landlord?tab=messages&chat=' || new.conversation_id::text
      else '/student?tab=messages&chat=' || new.conversation_id::text
    end,
    new.conversation_id,
    true
  );
  return new;
end;
$$;

-- ── Viewing notifications (urgent + both-party cancel) ──
create or replace function public.trg_notify_viewing_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  select title into v_title from public.listings where id = new.listing_id;

  if tg_op = 'INSERT' then
    perform public.notify_user(
      new.landlord_id,
      'viewing_request',
      'New viewing request',
      coalesce('For ' || v_title, 'A student requested a viewing'),
      '/landlord?tab=viewings',
      new.id,
      true
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'confirmed' then
      perform public.notify_user(
        new.student_id, 'viewing_confirmed', 'Viewing confirmed',
        coalesce(v_title, 'Your viewing was confirmed'),
        '/student?tab=viewings', new.id, true
      );
    elsif new.status = 'declined' then
      perform public.notify_user(
        new.student_id, 'viewing_declined', 'Viewing declined',
        coalesce(v_title, 'Your viewing request was declined'),
        '/student?tab=viewings', new.id, true
      );
    elsif new.status = 'cancelled' then
      if new.cancelled_by = new.student_id then
        perform public.notify_user(
          new.landlord_id, 'viewing_cancelled', 'Viewing cancelled',
          coalesce(v_title, 'Student cancelled the viewing'),
          '/landlord?tab=viewings', new.id, true
        );
      elsif new.cancelled_by = new.landlord_id then
        perform public.notify_user(
          new.student_id, 'viewing_cancelled', 'Viewing cancelled',
          coalesce(v_title, 'Landlord cancelled the viewing'),
          '/student?tab=viewings', new.id, true
        );
      else
        perform public.notify_user(
          new.landlord_id, 'viewing_cancelled', 'Viewing cancelled',
          coalesce(v_title, 'Viewing was cancelled'),
          '/landlord?tab=viewings', new.id, true
        );
        perform public.notify_user(
          new.student_id, 'viewing_cancelled', 'Viewing cancelled',
          coalesce(v_title, 'Viewing was cancelled'),
          '/student?tab=viewings', new.id, true
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- ── Application notifications (resubmit + urgent) ──
create or replace function public.trg_notify_application()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  select title into v_title from public.listings where id = new.listing_id;

  if tg_op = 'INSERT' then
    perform public.notify_user(
      new.landlord_id,
      'application_submitted',
      'New application',
      coalesce('For ' || v_title, 'A student applied'),
      '/landlord?tab=applications',
      new.id,
      true
    );
    perform public.notify_admins(
      'admin_application',
      'New rental application',
      coalesce(v_title, 'Listing application'),
      '/admin?tab=applications',
      new.id,
      true
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status is distinct from new.status and new.status = 'submitted'
       and old.status in ('withdrawn', 'rejected', 'ended') then
      perform public.notify_user(
        new.landlord_id,
        'application_submitted',
        'Application resubmitted',
        coalesce('For ' || v_title, 'A student reapplied'),
        '/landlord?tab=applications',
        new.id,
        true
      );
    end if;

    if old.status is distinct from new.status then
      if new.status = 'accepted' then
        perform public.notify_user(
          new.student_id, 'application_accepted', 'Application accepted',
          coalesce(v_title, 'Your application was accepted'),
          '/student?tab=applications', new.id, true
        );
      elsif new.status = 'rejected' then
        perform public.notify_user(
          new.student_id, 'application_rejected', 'Application declined',
          coalesce(v_title, 'Your application was not accepted'),
          '/student?tab=applications', new.id, true
        );
      elsif new.status = 'withdrawn' then
        perform public.notify_user(
          new.landlord_id, 'application_withdrawn', 'Application withdrawn',
          coalesce(v_title, 'Student withdrew their application'),
          '/landlord?tab=applications', new.id, true
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;
