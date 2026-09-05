import { escapeHtml, page } from "./layout.js";

const FORM_STYLES = `
  .counter { display: block; text-align: right; font-size: 12px; color: var(--muted); margin-top: 6px; }
`;

export function renderForm({ title }) {
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
</script>`,
  });
}
