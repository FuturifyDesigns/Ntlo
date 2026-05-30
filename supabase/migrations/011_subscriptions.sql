-- Landlord subscriptions + manual FNB receipt verification
-- Run in Supabase SQL Editor after 010_security_hardening.sql

alter table public.profiles add column if not exists subscription_status text default 'early_access';
alter table public.profiles drop constraint if exists profiles_subscription_status_check;
alter table public.profiles add constraint profiles_subscription_status_check
  check (subscription_status in ('early_access', 'active', 'pending_payment', 'expired', 'none'));

alter table public.profiles add column if not exists subscription_period_end timestamptz;

alter table public.profiles drop constraint if exists profiles_subscription_tier_check;
alter table public.profiles add constraint profiles_subscription_tier_check
  check (subscription_tier in ('free', 'early_access', 'basic', 'standard', 'premium'));

update public.profiles
set
  subscription_status = coalesce(subscription_status, 'early_access'),
  subscription_tier = case
    when subscription_tier is null or subscription_tier = 'free' then 'early_access'
    else subscription_tier
  end
where role = 'landlord';

-- ── Payment receipts (landlord uploads proof of FNB transfer) ──

create table if not exists public.payment_receipts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null check (tier in ('basic', 'standard', 'premium')),
  amount_pula numeric(10, 2),
  storage_path text not null,
  file_name text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  period_start timestamptz,
  period_end timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_payment_receipts_user on public.payment_receipts(user_id);
create index if not exists idx_payment_receipts_status on public.payment_receipts(status);

alter table public.payment_receipts enable row level security;

create policy "Landlords view own payment receipts" on public.payment_receipts
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Landlords insert own payment receipts" on public.payment_receipts
  for insert with check (auth.uid() = user_id);

create policy "Admins manage payment receipts" on public.payment_receipts
  for all using (public.is_admin());

-- ── Lock subscription fields on profiles (extend security trigger) ──

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
    if coalesce(new.verification_status, 'none') not in ('none', 'pending') then
      new.verification_status := 'none';
    end if;
    new.verification_notes := null;
    new.subscription_tier := 'early_access';
    new.subscription_status := 'early_access';
    new.subscription_period_end := null;
    return new;
  end if;

  new.role := old.role;
  new.is_verified := old.is_verified;
  new.is_banned := old.is_banned;
  new.banned_at := old.banned_at;
  new.banned_reason := old.banned_reason;
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

-- ── Admin: approve / reject a payment receipt and activate subscription ──

create or replace function public.admin_review_payment_receipt(
  receipt_id uuid,
  approved boolean,
  note text default null,
  months integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.payment_receipts%rowtype;
  new_end timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  select * into rec from public.payment_receipts where id = receipt_id;
  if not found then
    raise exception 'Receipt not found';
  end if;

  if approved then
    new_end := coalesce(
      case
        when (select subscription_period_end from public.profiles where id = rec.user_id) > now()
          then (select subscription_period_end from public.profiles where id = rec.user_id)
        else now()
      end,
      now()
    ) + (months || ' months')::interval;

    update public.payment_receipts
    set
      status = 'approved',
      admin_notes = note,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      period_start = now(),
      period_end = new_end
    where id = receipt_id;

    update public.profiles
    set
      subscription_tier = rec.tier,
      subscription_status = 'active',
      subscription_period_end = new_end
    where id = rec.user_id and role = 'landlord';
  else
    update public.payment_receipts
    set
      status = 'rejected',
      admin_notes = note,
      reviewed_at = now(),
      reviewed_by = auth.uid()
    where id = receipt_id;

    update public.profiles
    set subscription_status = 'pending_payment'
    where id = rec.user_id
      and role = 'landlord'
      and subscription_status not in ('active', 'early_access');
  end if;
end;
$$;

-- ── Realtime ──

alter publication supabase_realtime add table public.payment_receipts;

-- ── Storage: payment-receipts (private) ──

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

drop policy if exists "Landlords upload own payment receipts" on storage.objects;
drop policy if exists "Landlords and admins read payment receipts" on storage.objects;

create policy "Landlords upload own payment receipts" on storage.objects
  for insert with check (
    bucket_id = 'payment-receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Landlords and admins read payment receipts" on storage.objects
  for select using (
    bucket_id = 'payment-receipts'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );
