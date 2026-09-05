# 講座アンケート

講座の感想を集めるアンケートフォームです。Cloudflare Workers + D1 で動きます。

| パス | 内容 |
| --- | --- |
| `/` | 受講者に配るアンケートフォーム（ニックネーム / 満足度 5 段階 / 自由記述） |
| `/admin` | 回答一覧・集計（Basic 認証で保護） |
| `/admin/responses.csv` | 回答の CSV ダウンロード（Excel 対応の BOM 付き） |
| `/api/responses` | 回答を保存する API（`POST`） |
| `/api/admin/responses` | 回答一覧の JSON（Basic 認証で保護） |

## デプロイ

リポジトリを clone して、次の 1 行を実行するだけです。

```bash
./deploy.sh
```

途中で 2 回だけ操作を求められます。

1. **Cloudflare へのログイン** — ブラウザが開くので許可してください（初回のみ）
2. **回答一覧のパスワード** — `/admin` を開くときに使うパスワードを入力します

スクリプトは D1 データベースの作成、`wrangler.jsonc` への ID 書き込み、テーブル作成、
シークレット登録、デプロイまでをまとめて行います。何度実行しても安全です（冪等）。

完了すると `https://kouza-survey.<あなたのサブドメイン>.workers.dev` が発行されます。
このアドレスを受講者に配ってください。

## 回答一覧を見る

`https://.../admin` を開くとユーザー名とパスワードを聞かれます。
**ユーザー名は何でも構いません**（空欄でも可）。パスワードはデプロイ時に設定したものです。

パスワードを変えたいとき:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

## タイトルを変える

`wrangler.jsonc` に次を足すと、フォームの見出しが変わります。

```jsonc
"vars": { "SURVEY_TITLE": "〇〇講座 受講後アンケート" }
```

## 手元で動かす

```bash
npm install
npm run db:init:local   # ローカル D1 にテーブルを作る（初回のみ）
npm run dev             # http://127.0.0.1:8787
```

ローカルの `/admin` のパスワードは `.dev.vars` の `ADMIN_PASSWORD` です
（このファイルは Git 管理外なので、無ければ作成してください）。

```
ADMIN_PASSWORD=localtest
```

## 構成

```
src/index.js         ルーティング・入力検証・Basic 認証・CSV 出力
src/pages/form.js    アンケートフォーム
src/pages/admin.js   回答一覧と集計
src/pages/layout.js  共通の HTML 骨組みとスタイル
schema.sql           responses テーブルの定義
deploy.sh            初回セットアップ込みのデプロイ手順
```

## 仕様メモ

- 回答は D1 の `responses` テーブルに保存されます（`id` / `nickname` / `rating` / `comment` / `created_at`）
- `created_at` は UTC で保存し、一覧では日本時間に変換して表示します
- 入力はサーバー側でも検証します（ニックネーム必須 40 文字、満足度 1〜5 の整数、感想 2000 文字）
- 一覧に表示する値は HTML エスケープしています
- ダークモードに対応しています（閲覧者の OS 設定に追従）
