// Kết nối Supabase qua REST API (PostgREST) - không cần cài thư viện
// Publishable key được phép để public trên frontend; dữ liệu được bảo vệ bằng RLS (chỉ cho SELECT).
const SUPABASE_URL = 'https://kmpythsxungwuesejxal.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ksZ1LFOWOaiQ5dYuGvuDzQ_tBUIUSyp';

/**
 * Lấy danh sách kênh từ bảng `channels` trên Supabase.
 * Nếu lỗi mạng/Supabase, trả về dữ liệu dự phòng CHANNELS_DATA (channels-data.js) nếu có.
 * @returns {Promise<Array<Object>>}
 */
function loadChannels() {
    const endpoint = SUPABASE_URL + '/rest/v1/channels?select=*&order=subscribers.desc';

    return fetch(endpoint, {
        headers: {
            apikey: SUPABASE_KEY,
            Accept: 'application/json'
        }
    })
        .then(function (res) {
            if (!res.ok) throw new Error('Supabase HTTP ' + res.status);
            return res.json();
        })
        .then(function (rows) {
            if (!Array.isArray(rows) || rows.length === 0) throw new Error('Supabase trả về rỗng');
            return rows.map(function (r) {
                // BIGINT có thể về dạng chuỗi -> ép kiểu số để sort/format đúng
                r.subscribers = Number(r.subscribers) || 0;
                r.videos_count = Number(r.videos_count) || 0;
                r.view_count = Number(r.view_count) || 0;
                return r;
            });
        })
        .catch(function (err) {
            console.warn('[Supabase] Không tải được dữ liệu, dùng dữ liệu local:', err);
            return typeof CHANNELS_DATA !== 'undefined' ? CHANNELS_DATA : [];
        });
}
