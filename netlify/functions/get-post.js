const { json, preflight, sbRequest } = require('./_lib');

// 公開中の単一記事を返す（?id=UUID）
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  try {
    const id = (event.queryStringParameters || {}).id;
    if (!id) return json(400, { error: 'id が必要です' });
    const rows = await sbRequest(
      `/rest/v1/blog_posts?select=id,title,content,author,image_url,created_at&published=eq.true&id=eq.${encodeURIComponent(id)}`
    );
    if (!rows || rows.length === 0) return json(404, { error: '記事が見つかりません' });
    return json(200, { post: rows[0] });
  } catch (error) {
    return json(500, { error: error.message });
  }
};
