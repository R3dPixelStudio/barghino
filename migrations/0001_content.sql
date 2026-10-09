CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  locale TEXT NOT NULL CHECK (locale IN ('fa','en')),
  slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published')),
  revision TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  UNIQUE(locale, slug)
);
CREATE INDEX IF NOT EXISTS posts_status_locale ON posts(status,locale,updated_at);
CREATE TABLE IF NOT EXISTS media (key TEXT PRIMARY KEY, created_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, fingerprint TEXT NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS inquiries_rate ON inquiries(fingerprint, created_at);
