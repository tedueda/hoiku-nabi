const { json, preflight, sbRequest } = require('./_lib');

// 公開中のブログ記事一覧を返す（サーバー側でSupabaseにアクセス。キーは公開しない）
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  try {
    const posts = await sbRequest(
      '/rest/v1/blog_posts?select=id,title,content,author,image_url,created_at&published=eq.true&order=created_at.desc'
    );
    return json(200, { posts: posts || [] });
  } catch (error) {
    return json(500, { error: error.message });
  }
};
