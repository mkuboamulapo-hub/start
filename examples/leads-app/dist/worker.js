// src/pages/layout.js
var BASE_STYLES = `
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
  .wrap.wide { max-width: 1040px; }
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
  input[type="text"], input[type="email"], textarea, select {
    width: 100%;
    padding: 10px 12px;
    font: inherit;
    color: var(--ink);
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  input:focus, textarea:focus, select:focus {
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
<title>${escapeHtml(title)}</title>
<style>${BASE_STYLES}${style}</style>
</head>
<body>
${body}
</body>
</html>`;
}
function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function html(markup, status = 200) {
  return new Response(markup, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

// src/pages/form.js
var FORM_STYLES = `
  .counter { display: block; text-align: right; font-size: 12px; color: var(--muted); margin-top: 6px; }
`;
function renderForm({ title }) {
  return page({
    title,
    style: FORM_STYLES,
    body: `
<div class="wrap">
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p class="lede">下のフォームからお申し込みください。内容を確認のうえ、こちらからご連絡します。</p>

    <div id="note" class="note" hidden></div>

    <form id="lead-form" novalidate>
      <label class="field">
        <span class="label-text">お名前<span class="hint">必須</span></span>
        <input type="text" name="name" maxlength="60" required autocomplete="name" placeholder="例：村上周平">
      </label>

      <label class="field">
        <span class="label-text">メールアドレス<span class="hint">必須</span></span>
        <input type="email" name="email" maxlength="200" required autocomplete="email" placeholder="例：sample@example.com">
      </label>

      <label class="field">
        <span class="label-text">相談内容<span class="hint">必須・2000 文字まで</span></span>
        <textarea name="message" maxlength="2000" required placeholder="いまお困りのこと、相談したいことをお書きください。"></textarea>
        <span class="counter"><span id="count">0</span> / 2000</span>
      </label>

      <label class="field">
        <span class="label-text">希望日程<span class="hint">任意</span></span>
        <input type="text" name="preferred_date" maxlength="100" placeholder="例：来週の平日午後、9/12 以降ならいつでも">
      </label>

      <button type="submit" id="submit">この内容で申し込む</button>
    </form>
  </div>
</div>

<script>
  const form = document.getElementById("lead-form");
  const note = document.getElementById("note");
  const submit = document.getElementById("submit");
  const message = form.message;
  const count = document.getElementById("count");

  message.addEventListener("input", () => { count.textContent = message.value.length; });

  function show(kind, text) {
    note.className = "note " + kind;
    note.textContent = text;
    note.hidden = false;
    note.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: (data.get("name") || "").trim(),
      email: (data.get("email") || "").trim(),
      message: (data.get("message") || "").trim(),
      preferred_date: (data.get("preferred_date") || "").trim(),
    };

    if (!payload.name) return show("err", "お名前を入力してください。");
    if (!payload.email) return show("err", "メールアドレスを入力してください。");
    if (!payload.message) return show("err", "相談内容を入力してください。");

    submit.disabled = true;
    note.hidden = true;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "送信に失敗しました。");

      form.hidden = true;
      show("ok", "お申し込みを受け付けました。ご連絡をお待ちください。");
    } catch (error) {
      show("err", error.message);
      submit.disabled = false;
    }
  });
<\/script>`
  });
}

// src/pages/admin.js
var ADMIN_STYLES = `
  header.bar { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
  header.bar h1 { margin: 0; }
  .count { color: var(--muted); font-size: 14px; }
  .table-scroll { overflow-x: auto; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 12px; color: var(--muted); font-weight: 600; white-space: nowrap; background: var(--bg); }
  tbody tr:last-child td { border-bottom: 0; }
  td.when { white-space: nowrap; color: var(--muted); font-variant-numeric: tabular-nums; font-size: 13px; }
  td.name { font-weight: 600; word-break: break-word; }
  td.email { word-break: break-all; font-size: 13px; }
  td.message { white-space: pre-wrap; word-break: break-word; min-width: 280px; }
  td.when .date { display: block; }
  td.status { white-space: nowrap; }
  td.status select { min-width: 118px; padding: 7px 10px; }
  td.status .saved { display: block; font-size: 12px; color: var(--muted); margin-top: 4px; min-height: 18px; }
  td.status .saved.err { color: var(--err-ink); }
  .empty { padding: 48px 16px; text-align: center; color: var(--muted); }
`;
function formatJst(utcText) {
  const date = /* @__PURE__ */ new Date(`${String(utcText).replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return String(utcText);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
function renderAdmin({ title, rows, statuses }) {
  const options = (current) => statuses.map(
    (status) => `<option value="${escapeHtml(status)}"${status === current ? " selected" : ""}>${escapeHtml(status)}</option>`
  ).join("");
  const table = rows.length ? `<div class="table-scroll"><table>
        <thead><tr><th>申込日時 (JST)</th><th>名前</th><th>メール</th><th>相談内容</th><th>対応状況</th></tr></thead>
        <tbody>${rows.map(
    (row) => `<tr>
          <td class="when"><span class="date">${escapeHtml(formatJst(row.created_at))}</span></td>
          <td class="name">${escapeHtml(row.name)}</td>
          <td class="email"><a href="mailto:${escapeHtml(row.email)}">${escapeHtml(row.email)}</a></td>
          <td class="message">${escapeHtml(row.message)}${row.preferred_date ? `<div style="color:var(--muted);font-size:13px;margin-top:8px">希望日程：${escapeHtml(row.preferred_date)}</div>` : ""}</td>
          <td class="status">
            <select data-id="${row.id}" aria-label="対応状況">${options(row.status)}</select>
            <span class="saved" data-for="${row.id}"></span>
          </td>
        </tr>`
  ).join("")}</tbody>
      </table></div>` : `<div class="table-scroll"><p class="empty">まだ申し込みがありません。</p></div>`;
  return page({
    title: `${title} — 管理画面`,
    style: ADMIN_STYLES,
    body: `
<div class="wrap wide">
  <header class="bar">
    <h1>申し込み一覧</h1>
    <span class="count">全 ${rows.length} 件（新しい順）</span>
  </header>

  ${table}
</div>

<script>
  // 対応状況を変えたら、その場でサーバーに保存する
  document.querySelectorAll("td.status select").forEach((select) => {
    let previous = select.value;

    select.addEventListener("change", async () => {
      const id = select.dataset.id;
      const label = document.querySelector('.saved[data-for="' + id + '"]');
      const next = select.value;

      select.disabled = true;
      label.className = "saved";
      label.textContent = "保存中…";

      try {
        const res = await fetch("/api/admin/leads/" + id + "/status", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "保存に失敗しました。");

        previous = next;
        label.textContent = "保存しました";
        setTimeout(() => { if (label.textContent === "保存しました") label.textContent = ""; }, 2000);
      } catch (error) {
        select.value = previous;
        label.className = "saved err";
        label.textContent = error.message;
      } finally {
        select.disabled = false;
      }
    });
  });
<\/script>`
  });
}

// src/index.js
var DEFAULT_TITLE = "無料相談の申し込み";
var STATUSES = ["未対応", "連絡済み", "面談予定", "完了"];
var MAX_NAME = 60;
var MAX_EMAIL = 200;
var MAX_MESSAGE = 2e3;
var MAX_PREFERRED_DATE = 100;
var LIST_LIMIT = 1e3;
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
  return new Response("合言葉が必要です。", {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="leads admin", charset="UTF-8"',
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
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
  const text = (value) => typeof value === "string" ? value.trim() : "";
  const name = text(payload.name);
  if (!name) return "お名前を入力してください。";
  if (name.length > MAX_NAME) return `お名前は ${MAX_NAME} 文字以内で入力してください。`;
  const email = text(payload.email);
  if (!email) return "メールアドレスを入力してください。";
  if (email.length > MAX_EMAIL) return `メールアドレスは ${MAX_EMAIL} 文字以内で入力してください。`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "メールアドレスの形式を確認してください。";
  const message = text(payload.message);
  if (!message) return "相談内容を入力してください。";
  if (message.length > MAX_MESSAGE) return `相談内容は ${MAX_MESSAGE} 文字以内で入力してください。`;
  const preferredDate = text(payload.preferred_date);
  if (preferredDate.length > MAX_PREFERRED_DATE) {
    return `希望日程は ${MAX_PREFERRED_DATE} 文字以内で入力してください。`;
  }
  return { name, email, message, preferredDate };
}
async function listLeads(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, email, message, preferred_date, status, created_at
       FROM leads
      ORDER BY id DESC
      LIMIT ?`
  ).bind(LIST_LIMIT).all();
  return results ?? [];
}
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const title = env.SITE_TITLE || DEFAULT_TITLE;
    if (path === "/" && request.method === "GET") {
      return html(renderForm({ title }));
    }
    if (path === "/api/leads" && request.method === "POST") {
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
          `INSERT INTO leads (name, email, message, preferred_date) VALUES (?, ?, ?, ?)`
        ).bind(parsed.name, parsed.email, parsed.message, parsed.preferredDate).run();
        return json({ ok: true, id: meta?.last_row_id ?? null }, 201);
      } catch (error) {
        console.error("insert failed", error);
        return json({ error: "保存に失敗しました。時間をおいて再度お試しください。" }, 500);
      }
    }
    if (path === "/admin" && request.method === "GET") {
      const denied = checkAdminAuth(request, env);
      if (denied) return denied;
      const rows = await listLeads(env);
      return html(renderAdmin({ title, rows, statuses: STATUSES }));
    }
    const statusMatch = path.match(/^\/api\/admin\/leads\/(\d+)\/status$/);
    if (statusMatch && request.method === "PATCH") {
      const denied = checkAdminAuth(request, env);
      if (denied) return denied;
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "リクエストの形式が不正です。" }, 400);
      }
      const status = typeof payload?.status === "string" ? payload.status : "";
      if (!STATUSES.includes(status)) return json({ error: "対応状況の値が不正です。" }, 400);
      try {
        const { meta } = await env.DB.prepare(`UPDATE leads SET status = ? WHERE id = ?`).bind(status, Number(statusMatch[1])).run();
        if (!meta?.changes) return json({ error: "対象の申し込みが見つかりません。" }, 404);
        return json({ ok: true, status });
      } catch (error) {
        console.error("update failed", error);
        return json({ error: "保存に失敗しました。時間をおいて再度お試しください。" }, 500);
      }
    }
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
export {
  index_default as default
};
