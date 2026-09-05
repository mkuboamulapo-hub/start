export const BASE_STYLES = `
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

export function page({ title, style = "", body }) {
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

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function html(markup, status = 200) {
  return new Response(markup, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
