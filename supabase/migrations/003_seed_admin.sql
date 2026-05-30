-- Promote Ntlo admin account (run after 002_admin_verification.sql)
update public.profiles
set role = 'admin'
where id = '5f5b0d88-65c6-48e2-88ff-47e7b3bd3806';
