const { json, preflight, checkAdmin, sbRequest } = require('./_lib');

// 管理用: 記事の削除
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    if (!checkAdmin(event)) return json(401, { error: 'パスワードが正しくありません' });
    const { id } = JSON.parse(event.body || '{}');
    if (!id) return json(400, { error: 'id が必要です' });
    await sbRequest(`/rest/v1/blog_posts?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return json(200, { ok: true });
  } catch (error) {
    return json(500, { error: error.message });
  }
};
