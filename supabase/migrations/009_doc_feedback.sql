-- Per-document feedback + resubmission flow
-- Run in Supabase SQL Editor after 002_admin_verification.sql

-- ── Allow a "changes_requested" state on profiles and documents ──

alter table public.profiles drop constraint if exists profiles_verification_status_check;
alter table public.profiles add constraint profiles_verification_status_check
  check (verification_status in ('none', 'pending', 'approved', 'rejected', 'changes_requested'));

alter table public.verification_documents drop constraint if exists verification_documents_status_check;
alter table public.verification_documents add constraint verification_documents_status_check
  check (status in ('pending', 'approved', 'rejected', 'changes_requested'));

-- ── Admin: request changes / review a single document ──

create or replace function public.admin_review_document(
  target_doc_id uuid,
  new_status text,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  doc_user uuid;
  doc_listing uuid;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  if new_status not in ('pending', 'approved', 'rejected', 'changes_requested') then
    raise exception 'Invalid status';
  end if;

  update public.verification_documents
  set
    status = new_status,
    admin_notes = note,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = target_doc_id
  returning user_id, listing_id into doc_user, doc_listing;

  -- When a landlord identity document needs changes, flag the whole profile
  -- so they're prompted to fix and resubmit.
  if new_status = 'changes_requested' and doc_user is not null and doc_listing is null then
    update public.profiles
    set verification_status = 'changes_requested'
    where id = doc_user and role = 'landlord';
  end if;
end;
$$;
