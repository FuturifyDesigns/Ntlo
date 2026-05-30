-- Admin panel, landlord verification, and document storage
-- Run in Supabase SQL Editor after schema.sql

-- ── Profiles: admin role, ban, landlord verification ──

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'landlord', 'admin'));

alter table public.profiles add column if not exists verification_status text default 'none'
  check (verification_status in ('none', 'pending', 'approved', 'rejected'));
alter table public.profiles add column if not exists verification_notes text;
alter table public.profiles add column if not exists is_banned boolean default false;
alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists banned_reason text;

-- Landlords start unverified; students/admins don't need verification
update public.profiles
set verification_status = case
  when role = 'landlord' and verification_status = 'none' and coalesce(is_verified, false) then 'approved'
  when role = 'landlord' and verification_status = 'none' then 'none'
  else verification_status
end
where role = 'landlord';

-- ── Listings: verification workflow ──

alter table public.listings add column if not exists verification_status text default 'pending'
  check (verification_status in ('pending', 'approved', 'rejected'));
alter table public.listings add column if not exists verification_notes text;

update public.listings
set verification_status = case when coalesce(is_verified, false) then 'approved' else 'pending' end
where verification_status is null;

-- ── Verification documents ──

create table if not exists public.verification_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  doc_type text not null,
  storage_path text not null,
  file_name text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  constraint verification_documents_owner check (user_id is not null or listing_id is not null)
);

create index if not exists idx_verification_documents_user on public.verification_documents(user_id);
create index if not exists idx_verification_documents_listing on public.verification_documents(listing_id);
create index if not exists idx_verification_documents_status on public.verification_documents(status);

alter table public.verification_documents enable row level security;

-- ── Admin helper ──

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and coalesce(is_banned, false) = false
  );
$$;

-- ── Drop old profile policies and replace ──

drop policy if exists "Profiles viewable by owner" on public.profiles;
drop policy if exists "Profiles editable by owner" on public.profiles;

create policy "Profiles viewable by owner or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Profiles editable by owner" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "Admins update any profile" on public.profiles
  for update using (public.is_admin());

-- ── University requests: admin access ──

drop policy if exists "Users can view own requests" on public.university_requests;

create policy "Users view own university requests" on public.university_requests
  for select using (auth.uid() = requested_by or requested_by is null or public.is_admin());

create policy "Admins manage university requests" on public.university_requests
  for update using (public.is_admin());

-- ── Verification documents policies ──

create policy "Users view own verification docs" on public.verification_documents
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Landlords view listing verification docs" on public.verification_documents
  for select using (
    listing_id is not null
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.landlord_id = auth.uid()
    )
  );

create policy "Users insert own verification docs" on public.verification_documents
  for insert with check (
    auth.uid() = user_id
    and listing_id is null
  );

create policy "Landlords insert listing verification docs" on public.verification_documents
  for insert with check (
    listing_id is not null
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.landlord_id = auth.uid()
    )
  );

create policy "Admins manage verification docs" on public.verification_documents
  for all using (public.is_admin());

-- ── Listings: admin can update verification ──

create policy "Admins update listings" on public.listings
  for update using (public.is_admin());

-- ── Admin RPC: ban, delete user ──

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
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if target_id = auth.uid() then
    raise exception 'Cannot ban yourself';
  end if;
  update public.profiles
  set
    is_banned = banned,
    banned_at = case when banned then now() else null end,
    banned_reason = case when banned then reason else null end
  where id = target_id;
end;
$$;

create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if target_id = auth.uid() then
    raise exception 'Cannot delete yourself';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

create or replace function public.admin_review_landlord(
  target_id uuid,
  approved boolean,
  notes text default null
)
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
    verification_status = case when approved then 'approved' else 'rejected' end,
    is_verified = approved,
    verification_notes = notes
  where id = target_id and role = 'landlord';

  update public.verification_documents
  set
    status = case when approved then 'approved' else 'rejected' end,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = notes
  where user_id = target_id and listing_id is null and status = 'pending';
end;
$$;

create or replace function public.admin_review_listing(
  target_listing_id uuid,
  approved boolean,
  notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  update public.listings
  set
    verification_status = case when approved then 'approved' else 'rejected' end,
    is_verified = approved,
    verification_notes = notes
  where id = target_listing_id;

  update public.verification_documents
  set
    status = case when approved then 'approved' else 'rejected' end,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = notes
  where listing_id = target_listing_id and status = 'pending';
end;
$$;

-- ── Realtime ──

alter publication supabase_realtime add table public.university_requests;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.verification_documents;
alter publication supabase_realtime add table public.listings;

-- ── Storage: verification-docs (private) ──

insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

drop policy if exists "Users upload own verification docs" on storage.objects;
drop policy if exists "Users and admins read verification docs" on storage.objects;
drop policy if exists "Users delete own verification docs" on storage.objects;

create policy "Users upload own verification docs" on storage.objects
  for insert with check (
    bucket_id = 'verification-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users and admins read verification docs" on storage.objects
  for select using (
    bucket_id = 'verification-docs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

create policy "Users delete own verification docs" on storage.objects
  for delete using (
    bucket_id = 'verification-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
