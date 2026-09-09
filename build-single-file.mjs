// src/ の 4 ファイルを、ブラウザの Cloudflare ダッシュボードに貼れる 1 ファイルにまとめる。
//
//   node build-single-file.mjs
//
// 出力: worker-single-file.js
// パソコンに何もインストールできない環境向け。ダッシュボードのエディタに貼り付けて使う。
import { readFileSync, writeFileSync } from "node:fs";

// 依存の少ない順に並べる（layout → form / admin → index）
const SOURCES = [
  "src/pages/layout.js",
  "src/pages/form.js",
  "src/pages/admin.js",
  "src/index.js",
];

/** モジュール間の import を外し、export を素の宣言に戻す */
function flatten(code, { keepDefaultExport }) {
  let out = code
    // 相対 import 行をまるごと削除（複数行に折り返されていても拾う）
    .replace(/^import\s[\s\S]*?from\s+["']\.[^"']*["'];\s*$/gm, "")
    // 名前付き export を素の宣言へ
    .replace(/^export\s+(const|let|var|function|class|async\s+function)\s/gm, "$1 ");

  if (!keepDefaultExport) {
    out = out.replace(/^export\s+default\s/gm, "");
  }
  return out.trim();
}

const header = `// 講座アンケート — 1 ファイル版（自動生成 / 直接編集しないでください）
//
// 生成元: ${SOURCES.join(", ")}
// 再生成: node build-single-file.mjs
//
// Cloudflare ダッシュボードの Worker エディタに、この内容をすべて貼り付けて使います。
// 必要な設定は 2 つだけです。
//   - D1 データベースを "DB" という名前でバインドする
//   - シークレット ADMIN_PASSWORD に /admin 用のパスワードを入れる
`;

const parts = SOURCES.map((file, i) =>
  [
    `// ${"─".repeat(60)}`,
    `// ${file}`,
    `// ${"─".repeat(60)}`,
    flatten(readFileSync(file, "utf8"), { keepDefaultExport: i === SOURCES.length - 1 }),
  ].join("\n")
);

const bundle = `${header}\n${parts.join("\n\n")}\n`;

// 生成物に import / 名前付き export が残っていたら、単体ファイルとして動かないので止める
const leftover = bundle.match(/^\s*(import\s[\s\S]*?from\s+["']\.|export\s+(?!default))/gm);
if (leftover) {
  throw new Error(`まとめきれなかった宣言が残っています: ${leftover.join(", ")}`);
}
if (!/^export default\s/m.test(bundle)) {
  throw new Error("export default が見つかりません。Worker として動きません。");
}

writeFileSync("worker-single-file.js", bundle);
console.log(`worker-single-file.js を生成しました（${bundle.split("\n").length} 行 / ${(Buffer.byteLength(bundle) / 1024).toFixed(1)} KB）`);
