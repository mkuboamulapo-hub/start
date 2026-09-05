-- 講座アンケートの回答テーブル
CREATE TABLE IF NOT EXISTS responses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname   TEXT    NOT NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses (created_at DESC);
