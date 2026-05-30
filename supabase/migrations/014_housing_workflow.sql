-- In-app messaging, viewings, applications, lease/move-in workflow
-- Run after 013_custom_university_city.sql

-- ── Denormalized landlord display (fixes verified badge for students) ──

alter table public.listings
  add column if not exists landlord_display_name text,
  add column if not exists landlord_verified boolean default false;

update public.listings l
set
  landlord_display_name = coalesce(p.full_name, 'Landlord'),
  landlord_verified = coalesce(p.is_verified, false)
from public.profiles p
where p.id = l.landlord_id
  and (l.landlord_display_name is null or l.landlord_verified is distinct from p.is_verified);

create or replace function public.sync_listing_landlord_display()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.landlord_id is distinct from coalesce(old.landlord_id, null) then
    select coalesce(full_name, 'Landlord'), coalesce(is_verified, false)
    into new.landlord_display_name, new.landlord_verified
    from public.profiles where id = new.landlord_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_listing_landlord_display on public.listings;
create trigger trg_sync_listing_landlord_display
  before insert or update of landlord_id on public.listings
  for each row execute function public.sync_listing_landlord_display();

create or replace function public.sync_listings_when_landlord_profile_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.listings
  set
    landlord_display_name = coalesce(new.full_name, 'Landlord'),
    landlord_verified = coalesce(new.is_verified, false)
  where landlord_id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_listings_landlord_profile on public.profiles;
create trigger trg_sync_listings_landlord_profile
  after update of full_name, is_verified, verification_status on public.profiles
  for each row execute function public.sync_listings_when_landlord_profile_changes();

-- ── Conversations & messages ──

create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  status text default 'open' check (status in ('open', 'archived')),
  last_message_at timestamptz,
  created_at timestamptz default now(),
  unique(listing_id, student_id)
);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at desc);
create index if not exists idx_conversations_student on public.conversations(student_id, last_message_at desc nulls last);
create index if not exists idx_conversations_landlord on public.conversations(landlord_id, last_message_at desc nulls last);

-- ── Viewing requests ──

create table if not exists public.viewing_requests (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  preferred_at timestamptz,
  message text,
  status text default 'pending'
    check (status in ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  landlord_notes text,
  confirmed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_viewing_landlord on public.viewing_requests(landlord_id, status, created_at desc);
create index if not exists idx_viewing_student on public.viewing_requests(student_id, created_at desc);

-- ── Applications ──

create table if not exists public.listing_applications (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  move_in_date date,
  duration_months integer check (duration_months is null or duration_months between 1 and 24),
  intro_message text,
  status text default 'submitted'
    check (status in ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  landlord_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(listing_id, student_id)
);

-- ── Lease / move-in ──

create table if not exists public.lease_flows (
  id uuid default gen_random_uuid() primary key,
  application_id uuid unique references public.listing_applications(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  status text default 'deposit_pending'
    check (status in ('deposit_pending', 'move_in', 'active', 'completed', 'cancelled')),
  deposit_pula integer,
  deposit_confirmed_at timestamptz,
  lease_start date,
  lease_end date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.move_in_checklist_items (
  id uuid default gen_random_uuid() primary key,
  lease_flow_id uuid not null references public.lease_flows(id) on delete cascade,
  item_key text not null,
  label text not null,
  assigned_to text not null check (assigned_to in ('student', 'landlord', 'both')),
  completed_by uuid references public.profiles(id),
  completed_at timestamptz,
  notes text,
  display_order integer default 0,
  unique(lease_flow_id, item_key)
);

-- ── RLS ──

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.viewing_requests enable row level security;
alter table public.listing_applications enable row level security;
alter table public.lease_flows enable row level security;
alter table public.move_in_checklist_items enable row level security;

create policy "Participants read conversations" on public.conversations
  for select using (auth.uid() in (student_id, landlord_id) or public.is_admin());

create policy "Students start conversations" on public.conversations
  for insert with check (
    auth.uid() = student_id
    and landlord_id = (select l.landlord_id from public.listings l where l.id = listing_id)
  );

create policy "Participants update conversations" on public.conversations
  for update using (auth.uid() in (student_id, landlord_id));

create policy "Participants read messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() in (c.student_id, c.landlord_id) or public.is_admin())
    )
  );

create policy "Participants send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and auth.uid() in (c.student_id, c.landlord_id)
        and c.status = 'open'
    )
  );

create policy "Participants mark messages read" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.student_id, c.landlord_id)
    )
  );

create policy "Parties read viewing requests" on public.viewing_requests
  for select using (auth.uid() in (student_id, landlord_id) or public.is_admin());

create policy "Students create viewing requests" on public.viewing_requests
  for insert with check (
    auth.uid() = student_id
    and landlord_id = (select l.landlord_id from public.listings l where l.id = listing_id)
  );

create policy "Parties update viewing requests" on public.viewing_requests
  for update using (auth.uid() in (student_id, landlord_id));

create policy "Parties read applications" on public.listing_applications
  for select using (auth.uid() in (student_id, landlord_id) or public.is_admin());

create policy "Students submit applications" on public.listing_applications
  for insert with check (
    auth.uid() = student_id
    and landlord_id = (select l.landlord_id from public.listings l where l.id = listing_id)
  );

create policy "Parties update applications" on public.listing_applications
  for update using (auth.uid() in (student_id, landlord_id));

create policy "Parties read lease flows" on public.lease_flows
  for select using (auth.uid() in (student_id, landlord_id) or public.is_admin());

create policy "Landlords create lease flows" on public.lease_flows
  for insert with check (auth.uid() = landlord_id);

create policy "Parties update lease flows" on public.lease_flows
  for update using (auth.uid() in (student_id, landlord_id));

create policy "Parties read checklist" on public.move_in_checklist_items
  for select using (
    exists (
      select 1 from public.lease_flows lf
      where lf.id = lease_flow_id
        and (auth.uid() in (lf.student_id, lf.landlord_id) or public.is_admin())
    )
  );

create policy "Parties update checklist" on public.move_in_checklist_items
  for update using (
    exists (
      select 1 from public.lease_flows lf
      where lf.id = lease_flow_id and auth.uid() in (lf.student_id, lf.landlord_id)
    )
  );

create policy "Landlord insert checklist items" on public.move_in_checklist_items
  for insert with check (
    exists (
      select 1 from public.lease_flows lf
      where lf.id = lease_flow_id and auth.uid() = lf.landlord_id
    )
  );

-- saved_listings realtime
alter publication supabase_realtime add table public.saved_listings;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.viewing_requests;
alter publication supabase_realtime add table public.listing_applications;
alter publication supabase_realtime add table public.lease_flows;
alter publication supabase_realtime add table public.move_in_checklist_items;

-- ── Helpers ──

create or replace function public.touch_conversation_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation_on_message on public.messages;
create trigger trg_touch_conversation_on_message
  after insert on public.messages for each row execute function public.touch_conversation_on_message();

create or replace function public.seed_move_in_checklist(p_lease_flow_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.move_in_checklist_items (lease_flow_id, item_key, label, assigned_to, display_order)
  values
    (p_lease_flow_id, 'deposit', 'Deposit paid and receipt shared', 'both', 1),
    (p_lease_flow_id, 'lease_signed', 'Written lease agreed by both parties', 'both', 2),
    (p_lease_flow_id, 'keys', 'Keys / access handed over', 'landlord', 3),
    (p_lease_flow_id, 'meter_reading', 'Utility meter readings recorded', 'landlord', 4),
    (p_lease_flow_id, 'inventory', 'Room condition photos taken', 'both', 5),
    (p_lease_flow_id, 'wifi', 'WiFi details shared (if included)', 'landlord', 6)
  on conflict (lease_flow_id, item_key) do nothing;
end;
$$;

create or replace function public.get_or_create_conversation(p_listing_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_landlord_id uuid;
  v_conversation_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select landlord_id into v_landlord_id from public.listings where id = p_listing_id;
  if v_landlord_id is null then raise exception 'Listing not found'; end if;
  if auth.uid() = v_landlord_id then raise exception 'Landlords cannot message their own listing'; end if;

  select id into v_conversation_id
  from public.conversations
  where listing_id = p_listing_id and student_id = auth.uid();

  if v_conversation_id is not null then return v_conversation_id; end if;

  insert into public.conversations (listing_id, student_id, landlord_id)
  values (p_listing_id, auth.uid(), v_landlord_id)
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

create or replace function public.respond_to_application(
  p_application_id uuid,
  p_accept boolean,
  p_notes text default null,
  p_deposit_pula integer default null,
  p_lease_start date default null,
  p_lease_end date default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  app public.listing_applications%rowtype;
  v_lease_id uuid;
begin
  select * into app from public.listing_applications where id = p_application_id;
  if not found then raise exception 'Application not found'; end if;
  if auth.uid() not in (app.landlord_id) and not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  update public.listing_applications
  set
    status = case when p_accept then 'accepted' else 'rejected' end,
    landlord_notes = p_notes,
    updated_at = now()
  where id = p_application_id;

  if not p_accept then return null; end if;

  insert into public.lease_flows (
    application_id, listing_id, student_id, landlord_id,
    status, deposit_pula, lease_start, lease_end
  )
  values (
    app.id, app.listing_id, app.student_id, app.landlord_id,
    'deposit_pending', p_deposit_pula, p_lease_start, p_lease_end
  )
  on conflict (application_id) do update set
    deposit_pula = coalesce(excluded.deposit_pula, lease_flows.deposit_pula),
    lease_start = coalesce(excluded.lease_start, lease_flows.lease_start),
    lease_end = coalesce(excluded.lease_end, lease_flows.lease_end),
    updated_at = now()
  returning id into v_lease_id;

  perform public.seed_move_in_checklist(v_lease_id);
  return v_lease_id;
end;
$$;

grant execute on function public.get_or_create_conversation(uuid) to authenticated;
grant execute on function public.respond_to_application(uuid, boolean, text, integer, date, date) to authenticated;

-- Allow housing participants to read counterpart names
create policy "Housing participants read profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.conversations c
      where auth.uid() in (c.student_id, c.landlord_id)
        and profiles.id in (c.student_id, c.landlord_id)
    )
    or exists (
      select 1 from public.viewing_requests vr
      where auth.uid() in (vr.student_id, vr.landlord_id)
        and profiles.id in (vr.student_id, vr.landlord_id)
    )
    or exists (
      select 1 from public.listing_applications la
      where auth.uid() in (la.student_id, la.landlord_id)
        and profiles.id in (la.student_id, la.landlord_id)
    )
    or exists (
      select 1 from public.lease_flows lf
      where auth.uid() in (lf.student_id, lf.landlord_id)
        and profiles.id in (lf.student_id, lf.landlord_id)
    )
  );

create policy "Public read landlord listing profiles" on public.profiles
  for select using (
    role = 'landlord'
    and exists (select 1 from public.listings l where l.landlord_id = profiles.id)
  );
