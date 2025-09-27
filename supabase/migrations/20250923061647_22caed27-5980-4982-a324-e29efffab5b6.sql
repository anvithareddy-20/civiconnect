-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reminders at 9 AM every day
SELECT cron.schedule(
  'daily-issue-reminders',
  '0 9 * * *', -- At 9:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://oopxazxddvdxhpolsoxu.supabase.co/functions/v1/daily-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcHhhenhkZHZkeGhwb2xzb3h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM0NTc3NywiZXhwIjoyMDczOTIxNzc3fQ.caMpN5A8-EYXt1_-5bq37o1nXvfhRfKNEtB6Zh0fE68"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);