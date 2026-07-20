const { json, preflight, env } = require('./_lib');

// テーマ(タイトル)から保育士求人ナビ向けのブログ記事(約1000文字)を生成
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let apiKey;
  try { apiKey = env('OPENAI_API_KEY'); }
  catch (e) { return json(500, { error: 'OpenAI APIキーがサーバーに設定されていません' }); }

  try {
    const { title } = JSON.parse(event.body || '{}');
    if (!title || !title.trim()) return json(400, { error: 'テーマ（タイトル）が必要です' });

    const prompt = `あなたは保育士向けの求人・転職情報サイト「保育士求人ナビ」のプロのブログライターです。
以下のテーマで、読者（保育士・保育士を目指す方）に役立つブログ記事を1000文字程度で作成してください。

テーマ: ${title}

要件:
- 保育士の転職・求人・働き方・保育園の種類（認可/認可外/企業主導型/小規模/こども園/病児保育 等）・大阪や沖縄などの地域情報 といったキーワードを、テーマに合う範囲で自然に含める
- SEOを意識しつつ、親しみやすく分かりやすい文章にする
- 読者が行動したくなる具体的な情報・アドバイスを盛り込む
- 1000文字程度
- 見出しは付けず、記事本文のみを出力（タイトルは含めない）`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'あなたは保育士の求人・転職に詳しいプロのブログライターです。魅力的で具体的な記事を書くことが得意です。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return json(res.status, { error: data.error?.message || 'OpenAI APIエラー' });
    }
    let content = (data.choices?.[0]?.message?.content || '').trim();
    if (!content) return json(500, { error: 'AIからの応答が空でした。再度お試しください。' });

    // 先頭にタイトルが重複して出力される場合があるため除去
    const lines = content.split('\n');
    const first = (lines[0] || '').replace(/^#+\s*/, '').replace(/["「」『』]/g, '').trim();
    const t = title.replace(/["「」『』]/g, '').trim();
    if (first && (first === t || first.includes(t) || t.includes(first))) {
      content = lines.slice(1).join('\n').trim();
    }

    return json(200, { content, usage: data.usage });
  } catch (error) {
    return json(500, { error: `ブログ生成に失敗しました: ${error.message}` });
  }
};
