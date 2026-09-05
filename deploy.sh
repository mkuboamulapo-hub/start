#!/usr/bin/env bash
# 講座アンケートを Cloudflare へデプロイする（初回セットアップ込み・冪等）
#
#   使い方:  ./deploy.sh
#
# 途中でブラウザが開き、Cloudflare へのログインを求められます（初回のみ）。
set -euo pipefail

DB_NAME="kouza-survey-db"
cd "$(dirname "$0")"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

step "依存パッケージを取得します"
npm install

step "Cloudflare にログインします（済んでいればスキップされます）"
if npx wrangler whoami 2>&1 | grep -qi "not authenticated"; then
  npx wrangler login
else
  echo "ログイン済みです"
fi

step "D1 データベース '${DB_NAME}' を用意します"
if ! npx wrangler d1 info "$DB_NAME" >/dev/null 2>&1; then
  npx wrangler d1 create "$DB_NAME"
fi

DB_ID="$(npx wrangler d1 info "$DB_NAME" --json | node -e \
  'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).uuid))')"
echo "database_id = ${DB_ID}"

step "wrangler.jsonc に database_id を書き込みます"
node -e '
  const fs = require("fs");
  const id = process.argv[1];
  const file = "wrangler.jsonc";
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(/"database_id":\s*"[^"]*"/, `"database_id": "${id}"`);
  fs.writeFileSync(file, after);
  console.log(before === after ? "変更なし（既に設定済み）" : "更新しました");
' "$DB_ID"

step "テーブルを作成します"
npx wrangler d1 execute "$DB_NAME" --remote --file=./schema.sql -y

step "回答一覧ページのパスワードを設定します"
if npx wrangler secret list 2>/dev/null | grep -q 'ADMIN_PASSWORD'; then
  echo "ADMIN_PASSWORD は設定済みです（変更するなら: npx wrangler secret put ADMIN_PASSWORD）"
else
  echo "回答一覧 (/admin) を開くためのパスワードを入力してください:"
  npx wrangler secret put ADMIN_PASSWORD
fi

step "デプロイします"
npx wrangler deploy

cat <<'DONE'

────────────────────────────────────────
 完了しました。上に表示された URL で:
   /       … 受講者に配るアンケートフォーム
   /admin  … 回答一覧（ユーザー名は任意 / パスワードは今設定したもの）
────────────────────────────────────────
DONE
