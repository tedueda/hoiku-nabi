// 共通ユーティリティ（依存なし・Node18+のグローバルfetchを使用）

const JSON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function preflight() {
  return { statusCode: 204, headers: JSON_HEADERS, body: '' };
}

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`環境変数 ${name} が設定されていません`);
  return v;
}

function checkAdmin(event) {
  const expected = process.env.BLOG_ADMIN_PASSWORD;
  if (!expected) throw new Error('BLOG_ADMIN_PASSWORD が未設定です');
  let given = event.headers['x-admin-password'] || event.headers['X-Admin-Password'] || '';
  if (!given && event.body) {
    try { given = (JSON.parse(event.body).password) || ''; } catch (_) {}
  }
  return given === expected;
}

// Supabase REST ヘルパ（service role）
function sbHeaders(key) {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

async function sbRequest(path, { method = 'GET', body, prefer } = {}) {
  const url = env('HOIKU_SUPABASE_URL').replace(/\/$/, '') + path;
  const key = env('HOIKU_SUPABASE_SERVICE_ROLE_KEY');
  const headers = sbHeaders(key);
  if (prefer) headers['Prefer'] = prefer;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

module.exports = { json, preflight, env, checkAdmin, sbRequest };
