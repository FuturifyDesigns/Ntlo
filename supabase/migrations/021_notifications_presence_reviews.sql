-- Notifications, online presence, review moderation, doc type fix.
-- Run after 020_abandon_incomplete_signup.sql (and ensure 014–017 housing migrations are applied).

-- ── Ensure application doc types (017) ──
alter table public.application_documents drop constraint if exists application_documents_doc_type_check;
alter table public.application_documents add constraint application_documents_doc_type_check
  check (doc_type in (
    'omang_or_passport',
    'registration_proof',
    'student_id',
    'student_card'
  ));

-- ── Online presence ──
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists idx_profiles_last_seen on public.profiles(last_seen_at desc nulls last);

create or replace function public.touch_last_seen()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  update public.profiles set last_seen_at = now() where id = auth.uid();
end;
$$;

grant execute on function public.touch_last_seen() to authenticated;

-- ── Notifications ──
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'message',
    'viewing_request',
    'viewing_confirmed',
    'viewing_declined',
    'viewing_cancelled',
    'application_submitted',
    'application_accepted',
    'application_rejected',
    'application_withdrawn',
    'review_posted',
    'admin_application',
    'admin_review',
    'admin_verification'
  )),
  title text not null,
  body text,
  link text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;

-- Inserts via triggers (security definer) only
drop policy if exists "System inserts notifications" on public.notifications;
create policy "System inserts notifications" on public.notifications
  for insert with check (false);

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users mark own notifications read" on public.notifications;
create policy "Users mark own notifications read" on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime (idempotent — profiles may already be in publication from 002)
do $$
declare
  t text;
begin
  foreach t in array array['reviews', 'profiles', 'notifications'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ── Review edit/delete ──
drop policy if exists "Students update own reviews" on public.reviews;
create policy "Students update own reviews" on public.reviews
  for update using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

drop policy if exists "Students delete own reviews" on public.reviews;
create policy "Students delete own reviews" on public.reviews
  for delete using (auth.uid() = student_id);

drop policy if exists "Admin delete reviews" on public.reviews;
create policy "Admin delete reviews" on public.reviews
  for delete using (public.is_admin());

-- ── Notification helpers ──
create or replace function public.notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_entity_id uuid default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then return; end if;
  insert into public.notifications (user_id, type, title, body, link, entity_id)
  values (p_user_id, p_type, p_title, p_body, p_link, p_entity_id);
end;
$$;

create or replace function public.notify_admins(
  p_type text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_entity_id uuid default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link, entity_id)
  select id, p_type, p_title, p_body, p_link, p_entity_id
  from public.profiles where role = 'admin';
end;
$$;

-- ── Triggers: messages ──
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
    '/listings/' || v_conv.listing_id::text,
    new.conversation_id
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
  after insert on public.messages for each row execute function public.trg_notify_new_message();

-- ── Triggers: viewing requests ──
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
      '/landlord',
      new.id
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'confirmed' then
      perform public.notify_user(new.student_id, 'viewing_confirmed', 'Viewing confirmed', coalesce(v_title, 'Your viewing was confirmed'), '/student', new.id);
    elsif new.status = 'declined' then
      perform public.notify_user(new.student_id, 'viewing_declined', 'Viewing declined', coalesce(v_title, 'Your viewing request was declined'), '/student', new.id);
    elsif new.status = 'cancelled' then
      perform public.notify_user(new.landlord_id, 'viewing_cancelled', 'Viewing cancelled', coalesce(v_title, 'Student cancelled the viewing'), '/landlord', new.id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_viewing_request on public.viewing_requests;
create trigger trg_notify_viewing_request
  after insert or update on public.viewing_requests for each row execute function public.trg_notify_viewing_request();

-- ── Triggers: applications ──
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
      '/landlord',
      new.id
    );
    perform public.notify_admins(
      'admin_application',
      'New rental application',
      coalesce(v_title, 'Listing application'),
      '/admin',
      new.id
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'accepted' then
      perform public.notify_user(new.student_id, 'application_accepted', 'Application accepted', coalesce(v_title, 'Your application was accepted'), '/student', new.id);
    elsif new.status = 'rejected' then
      perform public.notify_user(new.student_id, 'application_rejected', 'Application declined', coalesce(v_title, 'Your application was not accepted'), '/student', new.id);
    elsif new.status = 'withdrawn' then
      perform public.notify_user(new.landlord_id, 'application_withdrawn', 'Application withdrawn', coalesce(v_title, 'Student withdrew their application'), '/landlord', new.id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_application on public.listing_applications;
create trigger trg_notify_application
  after insert or update on public.listing_applications for each row execute function public.trg_notify_application();

-- ── Triggers: reviews ──
create or replace function public.trg_notify_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  if tg_op = 'INSERT' then
    select title into v_title from public.listings where id = new.listing_id;
    perform public.notify_admins(
      'admin_review',
      'New listing review',
      coalesce(v_title, 'A student left a review'),
      '/admin',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_review on public.reviews;
create trigger trg_notify_review
  after insert on public.reviews for each row execute function public.trg_notify_review();

-- ── Cancel viewing (student, pending only) ──
create or replace function public.cancel_viewing_request(p_viewing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_row public.viewing_requests%rowtype;
begin
  select * into v_row from public.viewing_requests where id = p_viewing_id;
  if not found then raise exception 'Viewing request not found'; end if;
  if auth.uid() <> v_row.student_id then raise exception 'Not allowed'; end if;
  if v_row.status <> 'pending' then raise exception 'Only pending viewings can be cancelled'; end if;

  update public.viewing_requests
  set status = 'cancelled', updated_at = now()
  where id = p_viewing_id;
end;
$$;

grant execute on function public.cancel_viewing_request(uuid) to authenticated;
