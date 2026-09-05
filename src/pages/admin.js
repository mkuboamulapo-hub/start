import { escapeHtml, page } from "./layout.js";

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

export function renderAdmin({ title, rows }) {
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
