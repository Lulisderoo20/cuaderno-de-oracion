CREATE TABLE IF NOT EXISTS prayers (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  detail TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_mode TEXT NOT NULL CHECK(author_mode IN ('named', 'anonymous')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS prayers_created_at_idx ON prayers(created_at DESC);
