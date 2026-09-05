import { html, json } from "./pages/layout.js";
import { renderForm } from "./pages/form.js";
import { renderAdmin } from "./pages/admin.js";

const DEFAULT_TITLE = "無料相談の申し込み";
const STATUSES = ["未対応", "連絡済み", "面談予定", "完了"];
const MAX_NAME = 60;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 2000;
const MAX_PREFERRED_DATE = 100;
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
  return new Response("合言葉が必要です。", {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="leads admin", charset="UTF-8"',
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

/**
 * 管理画面は Basic 認証（合言葉）で保護する。
 * 合言葉は ADMIN_PASSWORD シークレットから読む。未設定なら中身を一切返さない。
 */
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

/** 申し込み内容をサーバー側でも検証する。問題があればメッセージ（文字列）を返す。 */
function validate(payload) {
  if (typeof payload !== "object" || payload === null) return "リクエストの形式が不正です。";

  const text = (value) => (typeof value === "string" ? value.trim() : "");

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
  )
    .bind(LIST_LIMIT)
    .all();
  return results ?? [];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const title = env.SITE_TITLE || DEFAULT_TITLE;

    // 画面1: 申し込みフォーム（公開ページ）
    if (path === "/" && request.method === "GET") {
      return html(renderForm({ title }));
    }

    // フォームの送信先。D1 の leads テーブルに 1 行足す。
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
        )
          .bind(parsed.name, parsed.email, parsed.message, parsed.preferredDate)
          .run();

        // メール通知（Resend）を足すときは、保存が成功したこの位置で送信処理を呼ぶ。
        return json({ ok: true, id: meta?.last_row_id ?? null }, 201);
      } catch (error) {
        console.error("insert failed", error);
        return json({ error: "保存に失敗しました。時間をおいて再度お試しください。" }, 500);
      }
    }

    // 画面2: 管理画面（合言葉で保護）
    if (path === "/admin" && request.method === "GET") {
      const denied = checkAdminAuth(request, env);
      if (denied) return denied;

      const rows = await listLeads(env);
      return html(renderAdmin({ title, rows, statuses: STATUSES }));
    }

    // 対応状況の切り替え（合言葉で保護）
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
        const { meta } = await env.DB.prepare(`UPDATE leads SET status = ? WHERE id = ?`)
          .bind(status, Number(statusMatch[1]))
          .run();
        if (!meta?.changes) return json({ error: "対象の申し込みが見つかりません。" }, 404);
        return json({ ok: true, status });
      } catch (error) {
        console.error("update failed", error);
        return json({ error: "保存に失敗しました。時間をおいて再度お試しください。" }, 500);
      }
    }

    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
