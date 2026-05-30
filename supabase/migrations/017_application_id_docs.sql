-- Application docs: Omang/passport + registration proof
-- Run after 016_gender_rental_rules.sql

alter table public.application_documents drop constraint if exists application_documents_doc_type_check;
alter table public.application_documents add constraint application_documents_doc_type_check
  check (doc_type in (
    'omang_or_passport',
    'registration_proof',
    'student_id',
    'student_card'
  ));

-- Optional: cap object size at bucket level (5 MB hard limit per file)
update storage.buckets
set file_size_limit = 5242880
where id = 'application-docs';
