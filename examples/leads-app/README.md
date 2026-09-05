# 無料相談フォーム＋見込み顧客管理アプリ

手順書2 ⑤の記入例（見込み顧客管理アプリ）を、手順書3 の手順どおりに形にしたリファレンス実装です。
Cloudflare Workers + D1 だけで動きます。受講者が自分で作ったものと見比べるための「答え合わせ用」です。

| パス | 内容 |
| --- | --- |
| `/` | 申し込みフォーム（誰でも開ける公開ページ） |
| `/admin` | 申し込み一覧・対応状況の更新（合言葉で保護） |
| `/api/leads` | 申し込みを保存する API（`POST`） |
| `/api/admin/leads/:id/status` | 対応状況を保存する API（`PATCH`・合言葉で保護） |

## デプロイ

やり方は2つあります。

- **ターミナルが使える** → 下の「1コマンドでデプロイ」
- **ターミナルを使いたくない／使えない** → [`deploy-from-dashboard.md`](./deploy-from-dashboard.md)
  （Cloudflareの画面に `dist/worker.js` を貼るだけ。Node.js もターミナルも不要）

### 1コマンドでデプロイ

このフォルダに入って、次の 1 行を実行するだけです。

```bash
./deploy.sh
```

途中で 2 回だけ操作を求められます。

1. **Cloudflare へのログイン** — ブラウザが開くので許可してください（初回のみ）
2. **管理画面の合言葉** — デプロイが終わったあとに聞かれます。`/admin` を開くときに使う合言葉を入力します

スクリプトは D1 データベースの作成、`wrangler.jsonc` への ID 書き込み、テーブル作成、
デプロイ、合言葉の登録までをまとめて行います。何度実行しても安全です（冪等）。

合言葉を入力できない環境（対話入力が使えない場合）ではその手順だけスキップされ、
あとから設定する方法が表示されます。設定するまで `/admin` は中身を一切表示しません。

完了すると `https://leads-app.<あなたのサブドメイン>.workers.dev` が発行されます。

## 管理画面を見る

`https://.../admin` を開くとユーザー名と合言葉を聞かれます。
**ユーザー名は何でも構いません**（空欄でも可）。合言葉はデプロイ時に設定したものです。

合言葉を変えたいとき（忘れたときも同じ。上書きできます）:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

合言葉はコードにも設定ファイルにも書かず、Cloudflare のシークレットから読んでいます。
未設定のあいだは管理画面は中身を一切返しません。

## タイトルを変える

`wrangler.jsonc` に次を足すと、フォームの見出しが変わります。

```jsonc
"vars": { "SITE_TITLE": "無料相談のお申し込み" }
```

## 手元で動かす

```bash
npm install
npm run db:init:local   # ローカル D1 にテーブルを作る（初回のみ）
npm run dev             # http://127.0.0.1:8787
```

ローカルの `/admin` の合言葉は `.dev.vars` の `ADMIN_PASSWORD` です
（このファイルは Git 管理外なので、`.dev.vars.example` をコピーして作ってください）。

## 何がどこにあるか

```
src/index.js         ルーティング・入力検証・合言葉のチェック・D1 への読み書き
src/pages/form.js    画面1 申し込みフォーム
src/pages/admin.js   画面2 管理画面（一覧と対応状況のプルダウン）
src/pages/layout.js  共通の HTML 骨組みとスタイル
schema.sql           leads テーブルの定義
wrangler.jsonc       Worker の設定・D1 の紐づけ（database_id はデプロイ時に自動で入る）
deploy.sh            初回セットアップ込みのデプロイ手順
```

直したくなったときに見る場所:

- **フォームの文言・入力欄** → `src/pages/form.js`
- **一覧の見た目・列** → `src/pages/admin.js`
- **保存する項目を増やす** → `schema.sql` と `src/index.js` の `validate` / `INSERT`
- **合言葉** → コードではなく `npx wrangler secret put ADMIN_PASSWORD`

## 仕様メモ

- 申し込みは D1 の `leads` テーブルに保存されます
  （`id` / `name` / `email` / `message` / `preferred_date` / `status` / `created_at`）
- `status` は `未対応 / 連絡済み / 面談予定 / 完了` の 4 つだけ。DB 側の CHECK 制約でも縛っています
- `created_at` は UTC で保存し、一覧では日本時間に変換して表示します
- 入力はブラウザ側だけでなくサーバー側でも検証します
- 一覧に表示する値は HTML エスケープしています
- メール送信（Resend）は未実装です。足すときは `src/index.js` の INSERT 直後（コメントあり）に呼びます
- 手順書2【6. やらないこと】のとおり、申込者向けログイン・検索・ファイル添付は入れていません
