import { escapeHtml, page } from "./layout.js";

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

export function renderForm({ title }) {
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
