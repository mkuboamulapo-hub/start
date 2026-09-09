// 講座アンケート — 1 ファイル版（自動生成 / 直接編集しないでください）
//
// 生成元: src/pages/layout.js, src/pages/form.js, src/pages/admin.js, src/index.js
// 再生成: node build-single-file.mjs
//
// Cloudflare ダッシュボードの Worker エディタに、この内容をすべて貼り付けて使います。
// 必要な設定は 2 つだけです。
//   - D1 データベースを "DB" という名前でバインドする
//   - シークレット ADMIN_PASSWORD に /admin 用のパスワードを入れる

// ────────────────────────────────────────────────────────────
// src/pages/layout.js
// ────────────────────────────────────────────────────────────
const BASE_STYLES = `
  :root {
    color-scheme: light dark;
    --bg: #f4f5f7;
    --panel: #ffffff;
    --ink: #17181c;
    --muted: #676b76;
    --line: #e2e4e9;
    --accent: #3b5bdb;
    --accent-ink: #ffffff;
    --ok-bg: #e7f6ec;
    --ok-ink: #1c6b3a;
    --err-bg: #fdecec;
    --err-ink: #a32626;
    --radius: 12px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #16171b;
      --panel: #1e2026;
      --ink: #eceef2;
      --muted: #9aa0ad;
      --line: #313440;
      --accent: #7f9cf5;
      --accent-ink: #10131a;
      --ok-bg: #16321f;
      --ok-ink: #7ee2a8;
      --err-bg: #3a1c1c;
      --err-ink: #f6a6a6;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 16px 64px;
    background: var(--bg);
    color: var(--ink);
    font: 15px/1.7 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", Meiryo, sans-serif;
  }
  .wrap { max-width: 720px; margin: 0 auto; }
  .wrap.wide { max-width: 1000px; }
  .card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 28px;
  }
  h1 { margin: 0 0 6px; font-size: 22px; letter-spacing: .01em; }
  .lede { margin: 0 0 28px; color: var(--muted); font-size: 14px; }
  label.field { display: block; margin-bottom: 24px; }
  .label-text { display: block; font-weight: 600; margin-bottom: 8px; font-size: 14px; }
  .hint { font-weight: 400; color: var(--muted); font-size: 13px; margin-left: 6px; }
  input[type="text"], textarea {
    width: 100%;
    padding: 10px 12px;
    font: inherit;
    color: var(--ink);
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  input[type="text"]:focus, textarea:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
    border-color: transparent;
  }
  textarea { min-height: 140px; resize: vertical; }
  button {
    font: inherit;
    font-weight: 600;
    padding: 11px 24px;
    border: 0;
    border-radius: 8px;
    background: var(--accent);
    color: var(--accent-ink);
    cursor: pointer;
  }
  button:disabled { opacity: .55; cursor: progress; }
  .note { padding: 12px 14px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; }
  .note.ok  { background: var(--ok-bg);  color: var(--ok-ink); }
  .note.err { background: var(--err-bg); color: var(--err-ink); }
  a { color: var(--accent); }
`;

function page({ title, style = "", body }) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>${BASE_STYLES}${style}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function html(markup, status = 200) {
  return new Response(markup, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// ────────────────────────────────────────────────────────────
// src/pages/form.js
// ────────────────────────────────────────────────────────────
const FORM_STYLES = `
  fieldset { border: 0; margin: 0 0 24px; padding: 0; }
  legend { font-weight: 600; font-size: 14px; padding: 0; margin-bottom: 10px; }
  .scale { display: flex; gap: 8px; flex-wrap: wrap; }
  .scale input { position: absolute; opacity: 0; width: 0; height: 0; }
  .scale label {
    flex: 1 1 96px;
    text-align: center;
    padding: 12px 6px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--bg);
    cursor: pointer;
    line-height: 1.35;
  }
  .scale .num { display: block; font-size: 19px; font-weight: 700; }
  .scale .cap { display: block; font-size: 12px; color: var(--muted); }
  .scale input:checked + label {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-ink);
  }
  .scale input:checked + label .cap { color: var(--accent-ink); opacity: .85; }
  .scale input:focus-visible + label { outline: 2px solid var(--accent); outline-offset: 2px; }
  .counter { display: block; text-align: right; font-size: 12px; color: var(--muted); margin-top: 6px; }
`;

const SCALE = [
  { value: 1, caption: "不満" },
  { value: 2, caption: "やや不満" },
  { value: 3, caption: "ふつう" },
  { value: 4, caption: "満足" },
  { value: 5, caption: "とても満足" },
];

function renderForm({ title }) {
  const scale = SCALE.map(
    ({ value, caption }) => `
        <input type="radio" id="r${value}" name="rating" value="${value}" required>
        <label for="r${value}"><span class="num">${value}</span><span class="cap">${caption}</span></label>`
  ).join("");

  return page({
    title,
    style: FORM_STYLES,
    body: `
<div class="wrap">
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p class="lede">ご参加ありがとうございました。今後の講座づくりの参考にさせていただきます（所要 1 分ほど）。</p>

    <div id="note" class="note" hidden></div>

    <form id="survey" novalidate>
      <label class="field">
        <span class="label-text">ニックネーム<span class="hint">必須・40 文字まで</span></span>
        <input type="text" name="nickname" maxlength="40" required autocomplete="nickname" placeholder="例：たなか">
      </label>

      <fieldset>
        <legend>講座の満足度<span class="hint">必須</span></legend>
        <div class="scale">${scale}
        </div>
      </fieldset>

      <label class="field">
        <span class="label-text">ご感想・ご意見<span class="hint">任意・2000 文字まで</span></span>
        <textarea name="comment" maxlength="2000" placeholder="よかった点、改善してほしい点など、自由にお書きください。"></textarea>
        <span class="counter"><span id="count">0</span> / 2000</span>
      </label>

      <button type="submit" id="submit">回答を送信する</button>
    </form>
  </div>
</div>

<script>
  const form = document.getElementById("survey");
  const note = document.getElementById("note");
  const submit = document.getElementById("submit");
  const comment = form.comment;
  const count = document.getElementById("count");

  comment.addEventListener("input", () => { count.textContent = comment.value.length; });

  function show(kind, message) {
    note.className = "note " + kind;
    note.textContent = message;
    note.hidden = false;
    note.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      nickname: (data.get("nickname") || "").trim(),
      rating: Number(data.get("rating")),
      comment: (data.get("comment") || "").trim(),
    };

    if (!payload.nickname) return show("err", "ニックネームを入力してください。");
    if (!payload.rating) return show("err", "満足度を選択してください。");

    submit.disabled = true;
    note.hidden = true;
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "送信に失敗しました。");

      form.hidden = true;
      show("ok", "回答を送信しました。ご協力ありがとうございました！");
    } catch (error) {
      show("err", error.message);
      submit.disabled = false;
    }
  });
</script>`,
  });
}

// ────────────────────────────────────────────────────────────
// src/pages/admin.js
// ────────────────────────────────────────────────────────────
const ADMIN_STYLES = `
  header.bar { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
  header.bar h1 { margin: 0; }
  .actions { display: flex; gap: 14px; font-size: 14px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px 18px; }
  .stat .k { font-size: 12px; color: var(--muted); }
  .stat .v { font-size: 26px; font-weight: 700; letter-spacing: -.01em; }
  .dist { margin-bottom: 24px; }
  .dist-row { display: grid; grid-template-columns: 84px 1fr 52px; align-items: center; gap: 10px; margin-bottom: 6px; font-size: 13px; }
  .meter { background: var(--line); border-radius: 999px; height: 10px; overflow: hidden; }
  .meter > span { display: block; height: 100%; background: var(--accent); border-radius: 999px; }
  .dist-row .n { text-align: right; color: var(--muted); font-variant-numeric: tabular-nums; }
  .table-scroll { overflow-x: auto; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 12px; color: var(--muted); font-weight: 600; white-space: nowrap; background: var(--bg); }
  tbody tr:last-child td { border-bottom: 0; }
  td.when, td.id { white-space: nowrap; color: var(--muted); font-variant-numeric: tabular-nums; font-size: 13px; }
  td.rating { white-space: nowrap; font-variant-numeric: tabular-nums; }
  td.comment { white-space: pre-wrap; word-break: break-word; min-width: 280px; }
  td.nickname { font-weight: 600; word-break: break-word; }
  .empty { padding: 48px 16px; text-align: center; color: var(--muted); }
`;

const LABELS = { 1: "不満", 2: "やや不満", 3: "ふつう", 4: "満足", 5: "とても満足" };

function formatJst(utcText) {
  // D1 の datetime('now') は "YYYY-MM-DD HH:MM:SS"（UTC）で返る
  const date = new Date(`${String(utcText).replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return String(utcText);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function renderAdmin({ title, rows }) {
  const total = rows.length;
  const average = total ? rows.reduce((sum, r) => sum + r.rating, 0) / total : 0;

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) counts[row.rating] += 1;
  const peak = Math.max(1, ...Object.values(counts));

  const distribution = [5, 4, 3, 2, 1]
    .map((score) => {
      const n = counts[score];
      return `<div class="dist-row">
        <span>${score} ${LABELS[score]}</span>
        <span class="meter"><span style="width:${(n / peak) * 100}%"></span></span>
        <span class="n">${n} 件</span>
      </div>`;
    })
    .join("");

  const body = total
    ? `<div class="table-scroll"><table>
        <thead><tr><th>#</th><th>日時 (JST)</th><th>ニックネーム</th><th>満足度</th><th>ご感想</th></tr></thead>
        <tbody>${rows
          .map(
            (row) => `<tr>
          <td class="id">${row.id}</td>
          <td class="when">${escapeHtml(formatJst(row.created_at))}</td>
          <td class="nickname">${escapeHtml(row.nickname)}</td>
          <td class="rating">${row.rating} <span style="color:var(--muted)">${LABELS[row.rating]}</span></td>
          <td class="comment">${row.comment ? escapeHtml(row.comment) : '<span style="color:var(--muted)">（記入なし）</span>'}</td>
        </tr>`
          )
          .join("")}</tbody>
      </table></div>`
    : `<div class="table-scroll"><p class="empty">まだ回答がありません。</p></div>`;

  return page({
    title: `${title} — 回答一覧`,
    style: ADMIN_STYLES,
    body: `
<div class="wrap wide">
  <header class="bar">
    <h1>回答一覧</h1>
    <nav class="actions">
      <a href="/">フォームを開く</a>
      <a href="/admin/responses.csv">CSV でダウンロード</a>
    </nav>
  </header>

  <div class="summary">
    <div class="stat"><div class="k">回答数</div><div class="v">${total}</div></div>
    <div class="stat"><div class="k">平均満足度</div><div class="v">${total ? average.toFixed(2) : "—"}</div></div>
    <div class="stat"><div class="k">自由記述あり</div><div class="v">${rows.filter((r) => r.comment).length}</div></div>
  </div>

  <div class="dist">${distribution}</div>

  ${body}
</div>`,
  });
}

// ────────────────────────────────────────────────────────────
// src/index.js
// ────────────────────────────────────────────────────────────
const DEFAULT_TITLE = "講座アンケート";
const MAX_NICKNAME = 40;
const MAX_COMMENT = 2000;
const LIST_LIMIT = 1000;

/** タイミング差で秘密が漏れないよう、長さに依らず全文字を比較する */
function safeEqual(a, b) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

function unauthorized() {
  return new Response("認証が必要です。", {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="survey admin", charset="UTF-8"',
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

/** 回答一覧は Basic 認証で保護する。ADMIN_PASSWORD 未設定なら公開せず落とす。 */
function checkAdminAuth(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return new Response(
      "ADMIN_PASSWORD が未設定です。`npx wrangler secret put ADMIN_PASSWORD` で設定してください。",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("basic ")) return unauthorized();

  let decoded;
  try {
    decoded = new TextDecoder().decode(
      Uint8Array.from(atob(header.slice(6).trim()), (c) => c.charCodeAt(0))
    );
  } catch {
    return unauthorized();
  }

  const password = decoded.slice(decoded.indexOf(":") + 1);
  return safeEqual(password, env.ADMIN_PASSWORD) ? null : unauthorized();
}

function validate(payload) {
  if (typeof payload !== "object" || payload === null) return "リクエストの形式が不正です。";

  const nickname = typeof payload.nickname === "string" ? payload.nickname.trim() : "";
  if (!nickname) return "ニックネームを入力してください。";
  if (nickname.length > MAX_NICKNAME) return `ニックネームは ${MAX_NICKNAME} 文字以内で入力してください。`;

  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return "満足度は 1〜5 で選択してください。";

  const comment = typeof payload.comment === "string" ? payload.comment.trim() : "";
  if (comment.length > MAX_COMMENT) return `ご感想は ${MAX_COMMENT} 文字以内で入力してください。`;

  return { nickname, rating, comment };
}

function toCsv(rows) {
  const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [
    ["id", "created_at_utc", "nickname", "rating", "comment"].join(","),
    ...rows.map((r) => [r.id, r.created_at, r.nickname, r.rating, r.comment].map(cell).join(",")),
  ];
  // Excel が UTF-8 と判定できるよう BOM を付ける
  return `﻿${lines.join("\r\n")}\r\n`;
}

async function listResponses(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, nickname, rating, comment, created_at
       FROM responses
      ORDER BY id DESC
      LIMIT ?`
  )
    .bind(LIST_LIMIT)
    .all();
  return results ?? [];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const title = env.SURVEY_TITLE || DEFAULT_TITLE;

    if (path === "/" && request.method === "GET") {
      return html(renderForm({ title }));
    }

    if (path === "/api/responses" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "リクエストの形式が不正です。" }, 400);
      }

      const parsed = validate(payload);
      if (typeof parsed === "string") return json({ error: parsed }, 400);

      try {
        const { meta } = await env.DB.prepare(
          `INSERT INTO responses (nickname, rating, comment) VALUES (?, ?, ?)`
        )
          .bind(parsed.nickname, parsed.rating, parsed.comment)
          .run();
        return json({ ok: true, id: meta?.last_row_id ?? null }, 201);
      } catch (error) {
        console.error("insert failed", error);
        return json({ error: "保存に失敗しました。時間をおいて再度お試しください。" }, 500);
      }
    }

    if (path === "/admin" || path === "/admin/responses.csv" || path === "/api/admin/responses") {
      const denied = checkAdminAuth(request, env);
      if (denied) return denied;

      const rows = await listResponses(env);

      if (path === "/admin") return html(renderAdmin({ title, rows }));
      if (path === "/api/admin/responses") return json({ count: rows.length, responses: rows });

      return new Response(toCsv(rows), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="survey-responses.csv"`,
        },
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
