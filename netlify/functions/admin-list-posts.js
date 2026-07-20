const { json, preflight, checkAdmin, sbRequest } = require('./_lib');

// 管理用: 全記事（非公開含む）を返す
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    if (!checkAdmin(event)) return json(401, { error: 'パスワードが正しくありません' });
    const posts = await sbRequest(
      '/rest/v1/blog_posts?select=id,title,content,author,image_url,published,created_at&order=created_at.desc'
    );
    return json(200, { posts: posts || [] });
  } catch (error) {
    return json(500, { error: error.message });
  }
};
