-- Reliable landlord application fetch + notification links.
-- Run after 023_fix_landlord_application_visibility.sql

-- Fix notification links stored as bare /landlord
update public.notifications
set link = '/landlord?tab=applications'
where type in ('application_submitted', 'application_withdrawn')
  and (link is null or link = '/landlord');

update public.notifications
set link = '/landlord?tab=viewings'
where type in ('viewing_request', 'viewing_cancelled')
  and (link is null or link = '/landlord');

update public.notifications
set link = '/landlord?tab=messages'
where type = 'message'
  and link like '/landlord%'
  and link not like '%tab=%';

-- Landlord applications via listing ownership (bypasses embed/RLS edge cases)
create or replace function public.get_landlord_applications()
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(app_row order by app_row->>'created_at' desc),
    '[]'::jsonb
  )
  into v_result
  from (
    select jsonb_build_object(
      'id', la.id,
      'listing_id', la.listing_id,
      'student_id', la.student_id,
      'landlord_id', la.landlord_id,
      'move_in_date', la.move_in_date,
      'duration_months', la.duration_months,
      'intro_message', la.intro_message,
      'status', la.status,
      'landlord_notes', la.landlord_notes,
      'withdraw_reason_code', la.withdraw_reason_code,
      'withdraw_reason_note', la.withdraw_reason_note,
      'created_at', la.created_at,
      'updated_at', la.updated_at,
      'listing', jsonb_build_object(
        'id', l.id,
        'title', l.title,
        'area', l.area,
        'city', l.city,
        'price', l.price,
        'available', l.available,
        'gender_preference', l.gender_preference,
        'room_type', l.room_type
      ),
      'student', jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'phone', p.phone,
        'university_id', p.university_id,
        'gender', p.gender
      ),
      'documents', coalesce(
        (
          select jsonb_agg(jsonb_build_object(
            'id', d.id,
            'doc_type', d.doc_type,
            'file_name', d.file_name,
            'storage_path', d.storage_path,
            'created_at', d.created_at
          ) order by d.created_at)
          from public.application_documents d
          where d.application_id = la.id
        ),
        '[]'::jsonb
      )
    ) as app_row
    from public.listing_applications la
    inner join public.listings l on l.id = la.listing_id
    left join public.profiles p on p.id = la.student_id
    where l.landlord_id = v_uid
       or la.landlord_id = v_uid
  ) sub;

  return v_result;
end;
$$;

grant execute on function public.get_landlord_applications() to authenticated;

-- Re-sync any remaining mismatched landlord_id
update public.listing_applications la
set landlord_id = l.landlord_id
from public.listings l
where la.listing_id = l.id
  and la.landlord_id is distinct from l.landlord_id;
