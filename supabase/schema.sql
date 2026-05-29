-- Ntlo Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kbpoljwacmzrakztnlkd/sql

-- Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone text,
  role text check (role in ('student', 'landlord')) not null,
  university_id integer,
  avatar_url text,
  is_verified boolean default false,
  subscription_tier text default 'free',
  created_at timestamptz default now()
);

-- Universities
create table if not exists public.universities (
  id serial primary key,
  name text not null,
  slug text unique not null,
  short_name text not null,
  city text not null,
  lat float not null,
  lng float not null
);

-- Listings
create table if not exists public.listings (
  id uuid default gen_random_uuid() primary key,
  landlord_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price integer not null,
  room_type text check (room_type in ('single', 'sharing', 'self_contained', 'cottage', 'house')),
  gender_preference text check (gender_preference in ('any', 'male', 'female')) default 'any',
  address text not null,
  area text,
  city text not null,
  lat float,
  lng float,
  nearest_university_id integer references public.universities(id),
  distance_to_campus float,
  amenities text[] default '{}',
  whatsapp_number text not null,
  available boolean default true,
  is_verified boolean default false,
  featured boolean default false,
  views integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Listing Photos
create table if not exists public.listing_photos (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade,
  url text not null,
  is_cover boolean default false,
  display_order integer default 0
);

-- Reviews
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  rating integer check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz default now(),
  unique(listing_id, student_id)
);

-- Saved Listings
create table if not exists public.saved_listings (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(student_id, listing_id)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.reviews enable row level security;
alter table public.saved_listings enable row level security;
alter table public.universities enable row level security;

-- Policies
create policy "Profiles viewable by owner" on public.profiles for select using (auth.uid() = id);
create policy "Profiles editable by owner" on public.profiles for update using (auth.uid() = id);
create policy "Profiles insertable on signup" on public.profiles for insert with check (auth.uid() = id);
create policy "Anyone can view universities" on public.universities for select using (true);
create policy "Anyone can view available listings" on public.listings for select using (true);
create policy "Landlords insert own listings" on public.listings for insert with check (auth.uid() = landlord_id);
create policy "Landlords update own listings" on public.listings for update using (auth.uid() = landlord_id);
create policy "Landlords delete own listings" on public.listings for delete using (auth.uid() = landlord_id);
create policy "Anyone can view listing photos" on public.listing_photos for select using (true);
create policy "Landlords insert listing photos" on public.listing_photos for insert with check (
  exists (select 1 from public.listings where id = listing_id and landlord_id = auth.uid())
);
create policy "Landlords delete listing photos" on public.listing_photos for delete using (
  exists (select 1 from public.listings where id = listing_id and landlord_id = auth.uid())
);
create policy "Anyone can view reviews" on public.reviews for select using (true);
create policy "Students write reviews" on public.reviews for insert with check (auth.uid() = student_id);
create policy "Students manage own saves" on public.saved_listings for all using (auth.uid() = student_id);

-- Auto-create profile trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'User'
    ),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed universities
insert into public.universities (name, slug, short_name, city, lat, lng) values
('University of Botswana', 'university-of-botswana', 'UB', 'Gaborone', -24.6556, 25.9090),
('Botswana Intl University of Science & Technology', 'biust', 'BIUST', 'Palapye', -22.5506, 27.1268),
('Botho University', 'botho-university', 'Botho', 'Gaborone', -24.6282, 25.9116),
('Limkokwing University', 'limkokwing', 'Limkokwing', 'Gaborone', -24.6553, 25.9143),
('Ba Isago University', 'ba-isago', 'Ba Isago', 'Gaborone', -24.6420, 25.9080),
('ABM University College', 'abm-university', 'ABM', 'Gaborone', -24.6500, 25.9100),
('Gaborone University College', 'guc', 'GUC', 'Gaborone', -24.6510, 25.9060)
on conflict (slug) do nothing;

-- Storage bucket (run in Storage section or via SQL)
-- Create bucket named 'listing-photos' as PUBLIC in Supabase Dashboard

-- Add custom university name for "Other" listings (run if table already exists)
alter table public.listings add column if not exists custom_university_name text;

-- University requests (when user's campus isn't listed)
create table if not exists public.university_requests (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  city text not null,
  requested_by uuid references auth.users on delete set null,
  contact_email text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

alter table public.university_requests enable row level security;

create policy "Anyone can submit university requests" on public.university_requests
  for insert with check (true);

create policy "Users can view own requests" on public.university_requests
  for select using (auth.uid() = requested_by or requested_by is null);
