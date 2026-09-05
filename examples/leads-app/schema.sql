-- 無料相談の申し込みを保存するテーブル
CREATE TABLE IF NOT EXISTS leads (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  message        TEXT NOT NULL,
  preferred_date TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT '未対応'
                 CHECK (status IN ('未対応', '連絡済み', '面談予定', '完了')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
