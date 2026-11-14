// Supabase Edge Function: đồng bộ số liệu kênh từ YouTube Data API v3 vào bảng `channels`
// Cập nhật: subscribers, subscribers_formatted, videos_count, view_count
//
// Secrets cần khai báo (Dashboard → Edge Functions → Secrets):
//   YOUTUBE_API_KEY  - API key YouTube Data API v3
//   CRON_SECRET      - chuỗi bí mật tự đặt, người gọi phải gửi header `x-cron-secret`
// SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY được Supabase cung cấp sẵn.

import { createClient } from 'npm:@supabase/supabase-js@2';

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// 526000000 -> '526M', 4590000 -> '4.59M', 78000 -> '78K'
const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumSignificantDigits: 3,
});

type YtChannel = {
  id: string;
  statistics: {
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    videoCount?: string;
    viewCount?: string;
  };
};

async function fetchStatistics(ids: string[]): Promise<YtChannel[]> {
  const items: YtChannel[] = [];
  // YouTube cho tối đa 50 id mỗi request; part=statistics tốn 1 quota unit/request
  for (let i = 0; i < ids.length; i += 50) {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part', 'statistics');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('id', ids.slice(i, i + 50).join(','));
    url.searchParams.set('key', YOUTUBE_API_KEY);

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      throw new Error('YouTube API: ' + (data?.error?.message ?? res.status));
    }
    items.push(...(data.items ?? []));
  }
  return items;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!YOUTUBE_API_KEY) {
    return json({ error: 'Thiếu secret YOUTUBE_API_KEY' }, 500);
  }

  try {
    const { data: rows, error } = await supabase.from('channels').select('id');
    if (error) throw error;

    const ids = rows.map((r) => r.id as string);
    const items = await fetchStatistics(ids);
    const found = new Set(items.map((i) => i.id));

    const results = await Promise.all(
      items.map(async (ch) => {
        const s = ch.statistics;
        const patch: Record<string, unknown> = {
          videos_count: Number(s.videoCount ?? 0),
          view_count: Number(s.viewCount ?? 0),
        };
        // Kênh ẩn số subscriber thì giữ nguyên giá trị cũ
        if (!s.hiddenSubscriberCount && s.subscriberCount != null) {
          const subs = Number(s.subscriberCount);
          patch.subscribers = subs;
          patch.subscribers_formatted = compact.format(subs);
        }
        const { error } = await supabase.from('channels').update(patch).eq('id', ch.id);
        return { id: ch.id, ok: !error, error: error?.message };
      }),
    );

    return json({
      synced_at: new Date().toISOString(),
      total: ids.length,
      updated: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok),
      not_found_on_youtube: ids.filter((id) => !found.has(id)),
    });
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
