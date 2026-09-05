import { escapeHtml, page } from "./layout.js";

const ADMIN_STYLES = `
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
  // D1 の datetime('now') は "YYYY-MM-DD HH:MM:SS"（UTC）で返る
  const date = new Date(`${String(utcText).replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return String(utcText);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function renderAdmin({ title, rows, statuses }) {
  const options = (current) =>
    statuses
      .map(
        (status) =>
          `<option value="${escapeHtml(status)}"${status === current ? " selected" : ""}>${escapeHtml(status)}</option>`
      )
      .join("");

  const table = rows.length
    ? `<div class="table-scroll"><table>
        <thead><tr><th>申込日時 (JST)</th><th>名前</th><th>メール</th><th>相談内容</th><th>対応状況</th></tr></thead>
        <tbody>${rows
          .map(
            (row) => `<tr>
          <td class="when"><span class="date">${escapeHtml(formatJst(row.created_at))}</span></td>
          <td class="name">${escapeHtml(row.name)}</td>
          <td class="email"><a href="mailto:${escapeHtml(row.email)}">${escapeHtml(row.email)}</a></td>
          <td class="message">${escapeHtml(row.message)}${
            row.preferred_date
              ? `<div style="color:var(--muted);font-size:13px;margin-top:8px">希望日程：${escapeHtml(row.preferred_date)}</div>`
              : ""
          }</td>
          <td class="status">
            <select data-id="${row.id}" aria-label="対応状況">${options(row.status)}</select>
            <span class="saved" data-for="${row.id}"></span>
          </td>
        </tr>`
          )
          .join("")}</tbody>
      </table></div>`
    : `<div class="table-scroll"><p class="empty">まだ申し込みがありません。</p></div>`;

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
</script>`,
  });
}
