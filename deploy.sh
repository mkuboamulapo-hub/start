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
fail() { printf '\n\033[1;31m!! %s\033[0m\n' "$1" >&2; exit 1; }

step "Node.js を確認します"
command -v node >/dev/null 2>&1 || fail "Node.js が見つかりません。https://nodejs.org/ja からインストールしてください。"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || fail "Node.js 20 以上が必要です（今のバージョン: $(node -v)）。https://nodejs.org/ja から新しいものを入れ直してください。"
echo "Node.js $(node -v)"

step "依存パッケージを取得します"
npm install

step "Cloudflare にログインします（済んでいればスキップされます）"
# whoami の終了コードはログイン状態を表さないため、出力の文言で判定する
WHOAMI_OUT="$(npx wrangler whoami 2>&1 || true)"
if printf '%s' "$WHOAMI_OUT" | grep -qi "not authenticated"; then
  npx wrangler login
else
  echo "ログイン済みです"
fi

step "D1 データベース '${DB_NAME}' を用意します"
if ! npx wrangler d1 info "$DB_NAME" >/dev/null 2>&1; then
  npx wrangler d1 create "$DB_NAME" --location apac
fi

DB_INFO_JSON="$(npx wrangler d1 info "$DB_NAME" --json 2>/dev/null)"
DB_ID="$(printf '%s' "$DB_INFO_JSON" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    // バナーや警告行が混ざっても拾えるよう、最初の JSON オブジェクトだけを取り出す
    const body = s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1);
    const uuid = JSON.parse(body).uuid;
    if (!uuid) throw new Error("uuid が取得できませんでした");
    console.log(uuid);
  });
')" || fail "D1 データベースの ID を取得できませんでした。'npx wrangler d1 info ${DB_NAME}' を実行して確認してください。"
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

step "デプロイします"
# シークレット登録より先にデプロイする。Worker が未作成のまま `secret put` を実行すると
# 「空の Worker を作るか？」という余計な確認が出るため。
DEPLOY_LOG="$(mktemp)"
trap 'rm -f "$DEPLOY_LOG"' EXIT
npx wrangler deploy 2>&1 | tee "$DEPLOY_LOG"
WORKER_URL="$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' "$DEPLOY_LOG" | head -1 || true)"

step "回答一覧ページのパスワードを設定します"
if npx wrangler secret list 2>/dev/null | grep -q 'ADMIN_PASSWORD'; then
  echo "ADMIN_PASSWORD は設定済みです（変更するなら: npx wrangler secret put ADMIN_PASSWORD）"
else
  echo "回答一覧 (/admin) を開くためのパスワードを入力してください:"
  npx wrangler secret put ADMIN_PASSWORD
fi

printf '\n────────────────────────────────────────\n'
if [ -n "$WORKER_URL" ]; then
  echo " 完了しました。公開URLはこちらです:"
  echo ""
  echo "   ${WORKER_URL}          … 受講者に配るアンケートフォーム"
  echo "   ${WORKER_URL}/admin    … 回答一覧"
else
  echo " 完了しました。上に表示された URL で:"
  echo "   /       … 受講者に配るアンケートフォーム"
  echo "   /admin  … 回答一覧"
fi
echo ""
echo " /admin のユーザー名は何でも構いません（空欄でも可）。"
echo " パスワードは今設定したものです。"
printf '────────────────────────────────────────\n'
