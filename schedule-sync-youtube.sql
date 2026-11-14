-- Lên lịch gọi Edge Function sync-youtube tự động bằng pg_cron + pg_net (chạy trong Supabase)
-- Thay <CRON_SECRET> bằng đúng giá trị secret CRON_SECRET đã khai báo cho Edge Function.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Xóa lịch cũ (nếu có) để chạy lại file này không bị trùng
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'sync-youtube';

-- Chạy mỗi 6 giờ (00:00, 06:00, 12:00, 18:00 UTC)
SELECT cron.schedule(
    'sync-youtube',
    '0 */6 * * *',
    $$
    SELECT net.http_post(
        url := 'https://kmpythsxungwuesejxal.supabase.co/functions/v1/sync-youtube',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', '<CRON_SECRET>'
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
    );
    $$
);

-- Xem lịch sử chạy:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- Xem phản hồi của Edge Function:
-- SELECT id, status_code, content FROM net._http_response ORDER BY created DESC LIMIT 5;
