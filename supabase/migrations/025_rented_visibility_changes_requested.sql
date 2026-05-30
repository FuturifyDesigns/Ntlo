-- Rented listings stay visible, urgent accept alerts, landlord request-changes flow.
-- Run after 024_landlord_applications_rpc.sql

-- ── Listing occupancy (available / rented / unavailable) ──
alter table public.listings
  add column if not exists occupancy_status text not null default 'available';

alter table public.listings drop constraint if exists listings_occupancy_status_check;
alter table public.listings add constraint listings_occupancy_status_check
  check (occupancy_status in ('available', 'rented', 'unavailable'));

update public.listings
set occupancy_status = case
  when placed_application_id is not null then 'rented'
  when available = false then 'unavailable'
  else 'available'
end
where occupancy_status is distinct from case
  when placed_application_id is not null then 'rented'
  when available = false then 'unavailable'
  else 'available'
end;

create or replace function public.sync_listing_occupancy_available()
returns trigger language plpgsql as $$
begin
  new.available := (new.occupancy_status = 'available');
  return new;
end;
$$;

drop trigger if exists trg_sync_listing_occupancy on public.listings;
create trigger trg_sync_listing_occupancy
  before insert or update of occupancy_status on public.listings
  for each row execute function public.sync_listing_occupancy_available();

-- Keep available column in sync on backfill
update public.listings set occupancy_status = occupancy_status;

-- ── Application status: changes_requested ──
alter table public.listing_applications drop constraint if exists listing_applications_status_check;
alter table public.listing_applications add constraint listing_applications_status_check
  check (status in (
    'submitted', 'under_review', 'changes_requested',
    'accepted', 'rejected', 'withdrawn', 'rented', 'ended'
  ));

-- ── Notification types ──
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'message',
    'viewing_request', 'viewing_confirmed', 'viewing_declined', 'viewing_cancelled',
    'application_submitted', 'application_accepted', 'application_rejected',
    'application_withdrawn', 'application_changes_requested',
    'review_posted', 'admin_application', 'admin_review', 'admin_verification'
  ));

-- ── Listing access: only block unavailable/rented for new applicants ──
create or replace function public.validate_student_listing_access(
  p_student_id uuid,
  p_listing_id uuid,
  p_for_apply boolean default true
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_listing public.listings%rowtype;
  v_student public.profiles%rowtype;
begin
  select * into v_listing from public.listings where id = p_listing_id;
  if not found then raise exception 'Listing not found'; end if;

  if p_for_apply then
    if coalesce(v_listing.occupancy_status, case when v_listing.available then 'available' else 'unavailable' end) <> 'available' then
      if not exists (
        select 1 from public.listing_applications la
        where la.listing_id = p_listing_id
          and la.student_id = p_student_id
          and la.status = 'changes_requested'
      ) then
        raise exception 'This room is no longer available';
      end if;
    end if;
  elsif not v_listing.available and coalesce(v_listing.occupancy_status, 'unavailable') = 'unavailable' then
    raise exception 'This room is no longer available';
  end if;

  select * into v_student from public.profiles where id = p_student_id;
  if v_student.role <> 'student' then raise exception 'Only students can do this'; end if;
  if v_student.gender is null then
    raise exception 'Add your gender in your profile before applying or booking a viewing';
  end if;

  if not public.gender_matches_listing(v_student.gender, v_listing.gender_preference) then
    if v_listing.gender_preference = 'female' then
      raise exception 'This room is for female tenants only';
    elsif v_listing.gender_preference = 'male' then
      raise exception 'This room is for male tenants only';
    else
      raise exception 'You cannot apply to this room';
    end if;
  end if;

  if p_student_id = v_listing.landlord_id then
    raise exception 'You cannot apply to your own listing';
  end if;
end;
$$;

-- ── Doc upload while changes requested ──
drop policy if exists "Students upload application docs" on public.application_documents;
create policy "Students upload application docs" on public.application_documents
  for insert with check (
    auth.uid() = uploaded_by
    and exists (
      select 1 from public.listing_applications la
      where la.id = application_id
        and la.student_id = auth.uid()
        and la.status in ('submitted', 'changes_requested')
    )
  );

drop policy if exists "Students replace application docs while submitted" on public.application_documents;
create policy "Students replace application docs while submitted" on public.application_documents
  for update using (
    exists (
      select 1 from public.listing_applications la
      where la.id = application_id
        and la.student_id = auth.uid()
        and la.status in ('submitted', 'changes_requested')
    )
  );

drop policy if exists "Students delete application docs while submitted" on public.application_documents;
create policy "Students delete application docs while submitted" on public.application_documents
  for delete using (
    exists (
      select 1 from public.listing_applications la
      where la.id = application_id
        and la.student_id = auth.uid()
        and la.status in ('submitted', 'changes_requested')
    )
  );

-- ── Landlord request application changes ──
create or replace function public.request_application_changes(
  p_application_id uuid,
  p_message text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  app public.listing_applications%rowtype;
begin
  if nullif(trim(p_message), '') is null then
    raise exception 'Please describe what the student should fix';
  end if;

  select * into app from public.listing_applications where id = p_application_id;
  if not found then raise exception 'Application not found'; end if;
  if auth.uid() not in (app.landlord_id) and not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if app.status not in ('submitted', 'under_review') then
    raise exception 'Application is not awaiting review';
  end if;

  update public.listing_applications
  set
    status = 'changes_requested',
    landlord_notes = nullif(trim(p_message), ''),
    updated_at = now()
  where id = p_application_id;
end;
$$;

grant execute on function public.request_application_changes(uuid, text) to authenticated;

-- ── Withdraw includes changes_requested ──
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
    and status in ('submitted', 'under_review', 'changes_requested');

  if not found then raise exception 'Cannot withdraw this application'; end if;
end;
$$;

-- ── Accept/decline only from reviewable states ──
create or replace function public.respond_to_application(
  p_application_id uuid,
  p_accept boolean,
  p_notes text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  app public.listing_applications%rowtype;
begin
  select * into app from public.listing_applications where id = p_application_id;
  if not found then raise exception 'Application not found'; end if;
  if auth.uid() not in (app.landlord_id) and not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if app.status not in ('submitted', 'under_review') then
    raise exception 'Application is no longer pending review';
  end if;

  update public.listing_applications
  set
    status = case when p_accept then 'accepted' else 'rejected' end,
    landlord_notes = p_notes,
    accepted_at = case when p_accept then now() else null end,
    updated_at = now()
  where id = p_application_id;
end;
$$;

-- ── Mark rented: keep listing visible with rented badge ──
create or replace function public.mark_application_rented(p_application_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  app public.listing_applications%rowtype;
  prev_app_id uuid;
begin
  select * into app from public.listing_applications where id = p_application_id;
  if not found then raise exception 'Application not found'; end if;
  if auth.uid() not in (app.landlord_id) and not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if app.status <> 'accepted' then
    raise exception 'Only accepted applications can be marked as rented';
  end if;

  select la.id into prev_app_id
  from public.listing_applications la
  where la.student_id = app.student_id
    and la.status = 'rented'
    and la.id <> app.id
  limit 1;

  if prev_app_id is not null then
    update public.listing_applications
    set status = 'ended', updated_at = now()
    where id = prev_app_id;

    update public.listing_rental_history
    set ended_at = now(), end_reason = 'moved_to_new_listing'
    where application_id = prev_app_id and ended_at is null;

    update public.listings
    set occupancy_status = 'available', placed_application_id = null
    where placed_application_id = prev_app_id;
  end if;

  update public.listing_applications
  set status = 'rented', rented_at = now(), updated_at = now()
  where id = p_application_id;

  update public.listings
  set occupancy_status = 'rented', placed_application_id = p_application_id
  where id = app.listing_id;

  insert into public.listing_rental_history (
    listing_id, application_id, student_id, landlord_id, rented_at
  )
  values (app.listing_id, app.id, app.student_id, app.landlord_id, now());

  update public.listing_applications
  set
    status = 'rejected',
    landlord_notes = coalesce(landlord_notes, 'This room has been rented to another applicant.'),
    updated_at = now()
  where listing_id = app.listing_id
    and id <> p_application_id
    and status in ('submitted', 'under_review', 'accepted', 'changes_requested');
end;
$$;

-- ── Relist: back to available ──
create or replace function public.relist_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_listing public.listings%rowtype;
  v_app_id uuid;
begin
  select * into v_listing from public.listings where id = p_listing_id;
  if not found then raise exception 'Listing not found'; end if;
  if auth.uid() not in (v_listing.landlord_id) and not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if coalesce(v_listing.occupancy_status, 'available') = 'available' then
    raise exception 'Listing is already available';
  end if;

  v_app_id := v_listing.placed_application_id;

  if v_app_id is not null then
    update public.listing_applications
    set status = 'ended', updated_at = now()
    where id = v_app_id and status = 'rented';

    update public.listing_rental_history
    set ended_at = now(), end_reason = 'landlord_relisted'
    where application_id = v_app_id and ended_at is null;
  end if;

  update public.listings
  set occupancy_status = 'available', placed_application_id = null
  where id = p_listing_id;
end;
$$;

-- ── Application notifications (urgent accept + changes requested + resubmit) ──
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
       and old.status in ('withdrawn', 'rejected', 'ended', 'changes_requested') then
      perform public.notify_user(
        new.landlord_id,
        'application_submitted',
        case when old.status = 'changes_requested' then 'Application updated' else 'Application resubmitted' end,
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
          coalesce('Your application for ' || v_title || ' was accepted', 'Your application was accepted'),
          '/student?tab=applications', new.id, true
        );
      elsif new.status = 'rejected' then
        perform public.notify_user(
          new.student_id, 'application_rejected', 'Application declined',
          coalesce(v_title, 'Your application was not accepted'),
          '/student?tab=applications', new.id, true
        );
      elsif new.status = 'changes_requested' then
        perform public.notify_user(
          new.student_id,
          'application_changes_requested',
          'Application needs updates',
          coalesce(new.landlord_notes, 'Please update your documents and resubmit'),
          '/listings/' || new.listing_id::text,
          new.id,
          true
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

-- Realtime already enabled on listings; ensure occupancy updates propagate
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'listings'
  ) then
    alter publication supabase_realtime add table public.listings;
  end if;
end $$;
