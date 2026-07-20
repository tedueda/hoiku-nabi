# 保育ナビ ブログ機能

AI（ChatGPT）でブログ記事を自動生成し、公開できる機能です。

## 構成

- **管理画面**: `/admin`（パスワード保護）
  - テーマ（タイトル）入力 → 「AI生成」で約1000文字の記事を自動生成
  - トップ画像アップロード（Supabase Storage `blog-images` に保存）
  - 記事の作成・編集・削除、公開/非公開の切替
- **公開ブログ一覧**: `/blog`（記事をカード表示）
- **記事ページ**: `/blog/post.html?id=<UUID>`
- **バックエンド**: Netlify Functions（`netlify/functions/`）
  - すべてのAPIキーはサーバーサイド（環境変数）に保持し、公開JSには一切露出しません。

## Netlify 環境変数（サイト設定）

| 変数 | 用途 |
|---|---|
| `OPENAI_API_KEY` | ブログ記事のAI生成 |
| `HOIKU_SUPABASE_URL` | 保育ナビ専用SupabaseのURL |
| `HOIKU_SUPABASE_SERVICE_ROLE_KEY` | サーバー側の記事保存/削除・画像アップロード |
| `HOIKU_SUPABASE_ANON_KEY` | （予備） |
| `BLOG_ADMIN_PASSWORD` | `/admin` のログインパスワード |

## Supabase セットアップ

`hoiku-supabase-setup.sql` を Supabase の SQL Editor で実行すると、
`blog_posts` テーブル・RLS・画像用ストレージバケット `blog-images` が作成されます。

- 公開記事（`published = true`）は誰でも閲覧可能（RLS）
- 書き込み・削除・画像アップロードは Netlify Function 経由（service_role）のみ

## Functions 一覧

| Function | 認証 | 説明 |
|---|---|---|
| `generate-blog` | なし | テーマからAIで記事本文を生成 |
| `list-public-posts` | なし | 公開記事一覧 |
| `get-post` | なし | 公開記事の単体取得（`?id=`） |
| `admin-list-posts` | 管理PW | 全記事（非公開含む）一覧 |
| `save-post` | 管理PW | 記事の作成/更新・画像アップロード |
| `delete-post` | 管理PW | 記事の削除 |
