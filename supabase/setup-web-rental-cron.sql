-- ─────────────────────────────────────────────────────────────────────────────
-- One-time setup: schedule the daily web-rental crawl.
--
-- Run this ONCE in the Supabase SQL editor after deploying the
-- `sync-web-rentals` Edge Function. It is kept out of migrations because the
-- project ref and service-role key differ per environment.
--
-- Project: Ntlo (kbpoljwacmzrakztnlkd)
-- The service-role JWT is stored in Vault at runtime, not in this file.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Store the service key in Vault rather than inline in the cron command,
-- so it never shows up in pg_cron job listings.
-- Replace YOUR_SERVICE_ROLE_KEY only when running this file by hand.
select vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY',
  'web_rental_sync_key',
  'Service role key used by the daily web rental crawl'
)
where not exists (
  select 1 from vault.secrets where name = 'web_rental_sync_key'
);

select cron.unschedule('sync-web-rentals-daily')
where exists (select 1 from cron.job where jobname = 'sync-web-rentals-daily');

-- 02:00 UTC = 04:00 Botswana time, well outside student browsing hours.
select cron.schedule(
  'sync-web-rentals-daily',
  '0 2 * * *',
  $$
  select net.http_post(
    url := 'https://kbpoljwacmzrakztnlkd.supabase.co/functions/v1/sync-web-rentals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'web_rental_sync_key'
      )
    ),
    body := jsonb_build_object('budgetMs', 240000, 'detailLimit', 40),
    timeout_milliseconds := 300000
  );
  $$
);

-- Verify:
--   select jobname, schedule, active from cron.job;
--   select * from public.web_rental_sync_runs order by started_at desc limit 5;
