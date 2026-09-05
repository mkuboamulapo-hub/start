import { html, json } from "./pages/layout.js";
import { renderForm } from "./pages/form.js";
import { renderAdmin } from "./pages/admin.js";

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
