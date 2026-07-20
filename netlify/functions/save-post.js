const { json, preflight, env, checkAdmin, sbRequest } = require('./_lib');

// 管理用: 記事の新規作成 / 更新。画像はbase64データURLで受け取りSupabase Storageに保存。
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    if (!checkAdmin(event)) return json(401, { error: 'パスワードが正しくありません' });

    const payload = JSON.parse(event.body || '{}');
    const { id, title, content, author, published } = payload;
    if (!title || !content) return json(400, { error: 'タイトルと本文は必須です' });

    let image_url = payload.image_url || '';

    // 画像アップロード（dataURL形式: data:image/xxx;base64,....）
    if (payload.image_data) {
      const m = /^data:([^;]+);base64,(.*)$/.exec(payload.image_data);
      if (!m) return json(400, { error: '画像データの形式が不正です' });
      const mime = m[1];
      const buffer = Buffer.from(m[2], 'base64');
      const ext = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg');
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `blog-images/${fileName}`;
      const base = env('HOIKU_SUPABASE_URL').replace(/\/$/, '');
      const key = env('HOIKU_SUPABASE_SERVICE_ROLE_KEY');
      const up = await fetch(`${base}/storage/v1/object/${path}`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': mime, 'x-upsert': 'true' },
        body: buffer,
      });
      if (!up.ok) {
        const t = await up.text();
        return json(500, { error: `画像アップロード失敗: ${up.status} ${t}` });
      }
      image_url = `${base}/storage/v1/object/public/${path}`;
    }

    const row = {
      title,
      content,
      author: author || '保育士求人ナビ',
      image_url,
      published: published !== undefined ? !!published : true,
    };

    let result;
    if (id) {
      result = await sbRequest(`/rest/v1/blog_posts?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', body: row, prefer: 'return=representation',
      });
    } else {
      result = await sbRequest('/rest/v1/blog_posts', {
        method: 'POST', body: row, prefer: 'return=representation',
      });
    }
    return json(200, { post: Array.isArray(result) ? result[0] : result });
  } catch (error) {
    return json(500, { error: error.message });
  }
};
