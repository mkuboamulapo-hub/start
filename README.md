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

事前に必要なものは 2 つだけです。

- **Cloudflare のアカウント**（無料・カード不要 / https://dash.cloudflare.com/sign-up ）
  「ドメインを追加しますか」と聞かれても、今は追加しなくて構いません。
- **Node.js 20 以上**（ https://nodejs.org/ja ）

あとはリポジトリを clone して、次の 1 行を実行するだけです。

```bash
./deploy.sh
```

途中で操作を求められるのは、次の 2 回です。

1. **Cloudflare へのログイン** — ブラウザが開くので許可してください（初回のみ）
2. **回答一覧のパスワード** — `/admin` を開くときに使うパスワードを入力します

アカウントを作りたてのときだけ、これに加えて
**workers.dev のサブドメイン名**を 1 度聞かれることがあります。
好きな名前（例: 自分のニックネーム）を入れてください。これが公開URLの一部になります。

スクリプトは Node.js の確認、D1 データベースの作成、`wrangler.jsonc` への ID 書き込み、
テーブル作成、デプロイ、シークレット登録までをまとめて行います。
何度実行しても安全です（冪等）。

完了すると、最後に公開URLが表示されます。

```
https://kouza-survey.<あなたのサブドメイン>.workers.dev
```

このアドレスを受講者に配ってください。`/admin` を付けると回答一覧です。

## パソコンに何もインストールできないとき（ブラウザだけで公開する）

会社の PC などで Node.js や Git を入れられない場合は、Cloudflare の管理画面
（ダッシュボード）だけで公開できます。ターミナルもディスク容量も要りません。

貼り付ける用に、`src/` の 4 ファイルを 1 つにまとめたものを用意してあります。

```
worker-single-file.js
```

手順は 5 つです。

1. **Worker を作る** — ダッシュボードの Workers から新規作成し、いったんそのまま Deploy
2. **コードを貼る** — Edit code を開き、中身を全部消して `worker-single-file.js` を貼って Deploy
3. **D1 を作る** — Storage & Databases の D1 で `kouza-survey-db` を作成し、
   Console に `schema.sql` の中身を貼って実行（テーブルができます）
4. **D1 をつなぐ** — Worker の Settings → Bindings で D1 を追加し、
   変数名を必ず **`DB`** にして `kouza-survey-db` を選ぶ
5. **パスワードを設定** — Settings → Variables and Secrets で
   **Secret** として `ADMIN_PASSWORD` を追加

これで Worker の URL がそのまま公開 URL になります。

`worker-single-file.js` は自動生成ファイルです。直接編集せず、`src/` を直したうえで
次のコマンドで作り直してください。

```bash
node build-single-file.mjs
```

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

## うまくいかないとき

| 症状 | 対処 |
| --- | --- |
| `Node.js 20 以上が必要です` と出る | https://nodejs.org/ja から入れ直してください（LTS 版でOK） |
| `/admin` が 503 になる | パスワード未設定です。`npx wrangler secret put ADMIN_PASSWORD` |
| パスワードを忘れた | `npx wrangler secret put ADMIN_PASSWORD` で入れ直せます |
| もう一度やり直したい | `./deploy.sh` をそのまま再実行してください（何度でも安全です） |

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
