-- Simplified application flow: student docs, accept/decline, mark rented.
-- Deposit/lease/move-in happen outside the app. Admin retains full audit trail.
-- Run after 014_housing_workflow.sql

-- ── Application status: add rented ──

alter table public.listing_applications drop constraint if exists listing_applications_status_check;
alter table public.listing_applications add constraint listing_applications_status_check
  check (status in ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn', 'rented'));

alter table public.listing_applications
  add column if not exists accepted_at timestamptz,
  add column if not exists rented_at timestamptz;

alter table public.listings
  add column if not exists placed_application_id uuid references public.listing_applications(id) on delete set null;

-- ── Application documents (student proof) ──

create table if not exists public.application_documents (
  id uuid default gen_random_uuid() primary key,
  application_id uuid not null references public.listing_applications(id) on delete cascade,
  doc_type text not null check (doc_type in ('student_id', 'student_card', 'registration_proof')),
  storage_path text not null,
  file_name text,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(application_id, doc_type)
);

create index if not exists idx_application_documents_app on public.application_documents(application_id);

alter table public.application_documents enable row level security;

create policy "Parties and admin read application docs" on public.application_documents
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.listing_applications la
      where la.id = application_id
        and auth.uid() in (la.student_id, la.landlord_id)
    )
  );

create policy "Students upload application docs" on public.application_documents
  for insert with check (
    auth.uid() = uploaded_by
    and exists (
      select 1 from public.listing_applications la
      where la.id = application_id
        and la.student_id = auth.uid()
        and la.status = 'submitted'
    )
  );

create policy "Students replace application docs while submitted" on public.application_documents
  for update using (
    exists (
      select 1 from public.listing_applications la
      where la.id = application_id
        and la.student_id = auth.uid()
        and la.status = 'submitted'
    )
  );

create policy "Students delete application docs while submitted" on public.application_documents
  for delete using (
    exists (
      select 1 from public.listing_applications la
      where la.id = application_id
        and la.student_id = auth.uid()
        and la.status = 'submitted'
    )
  );

-- ── Storage: application-docs (private) ──

insert into storage.buckets (id, name, public)
values ('application-docs', 'application-docs', false)
on conflict (id) do nothing;

drop policy if exists "Students upload application docs storage" on storage.objects;
drop policy if exists "Parties read application docs storage" on storage.objects;
drop policy if exists "Students delete own application docs storage" on storage.objects;

create policy "Students upload application docs storage" on storage.objects
  for insert with check (
    bucket_id = 'application-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Parties read application docs storage" on storage.objects
  for select using (
    bucket_id = 'application-docs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
      or exists (
        select 1
        from public.application_documents ad
        join public.listing_applications la on la.id = ad.application_id
        where ad.storage_path = name
          and auth.uid() = la.landlord_id
      )
    )
  );

create policy "Students delete own application docs storage" on storage.objects
  for delete using (
    bucket_id = 'application-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Replace respond_to_application (no lease flow) ──

drop function if exists public.respond_to_application(uuid, boolean, text, integer, date, date);

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

-- ── Mark room as rented to accepted applicant ──

create or replace function public.mark_application_rented(p_application_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  app public.listing_applications%rowtype;
begin
  select * into app from public.listing_applications where id = p_application_id;
  if not found then raise exception 'Application not found'; end if;
  if auth.uid() not in (app.landlord_id) and not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if app.status <> 'accepted' then
    raise exception 'Only accepted applications can be marked as rented';
  end if;

  update public.listing_applications
  set status = 'rented', rented_at = now(), updated_at = now()
  where id = p_application_id;

  update public.listings
  set available = false, placed_application_id = p_application_id
  where id = app.listing_id;

  update public.listing_applications
  set
    status = 'rejected',
    landlord_notes = coalesce(landlord_notes, 'This room has been rented to another applicant.'),
    updated_at = now()
  where listing_id = app.listing_id
    and id <> p_application_id
    and status in ('submitted', 'under_review', 'accepted');
end;
$$;

-- ── Student withdraw ──

create or replace function public.withdraw_application(p_application_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.listing_applications
  set status = 'withdrawn', updated_at = now()
  where id = p_application_id
    and student_id = auth.uid()
    and status in ('submitted', 'under_review');
  if not found then raise exception 'Cannot withdraw this application'; end if;
end;
$$;

grant execute on function public.respond_to_application(uuid, boolean, text) to authenticated;
grant execute on function public.mark_application_rented(uuid) to authenticated;
grant execute on function public.withdraw_application(uuid) to authenticated;

-- Realtime
alter publication supabase_realtime add table public.application_documents;
