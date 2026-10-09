CREATE TABLE IF NOT EXISTS media_payloads (
  key TEXT PRIMARY KEY REFERENCES media(key) ON DELETE CASCADE,
  size INTEGER NOT NULL CHECK (size > 0 AND size <= 20971520)
);
CREATE TABLE IF NOT EXISTS media_chunks (
  key TEXT NOT NULL REFERENCES media_payloads(key) ON DELETE CASCADE,
  part INTEGER NOT NULL CHECK (part >= 0),
  bytes BLOB NOT NULL CHECK (length(bytes) <= 262144),
  PRIMARY KEY (key, part)
);
CREATE TABLE IF NOT EXISTS media_uploads (
  key TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size > 0 AND size <= 20971520),
  received INTEGER NOT NULL DEFAULT 0,
  next_part INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS media_uploads_expiry ON media_uploads(created_at);
CREATE TABLE IF NOT EXISTS media_upload_chunks (
  key TEXT NOT NULL REFERENCES media_uploads(key) ON DELETE CASCADE,
  part INTEGER NOT NULL CHECK (part >= 0),
  bytes BLOB NOT NULL CHECK (length(bytes) <= 262144),
  PRIMARY KEY (key, part)
);
CREATE TRIGGER IF NOT EXISTS media_upload_progress AFTER INSERT ON media_upload_chunks
BEGIN UPDATE media_uploads SET received=received+length(NEW.bytes), next_part=next_part+1 WHERE key=NEW.key; END;
CREATE TRIGGER IF NOT EXISTS media_upload_capacity BEFORE INSERT ON media_uploads
WHEN (SELECT COALESCE(SUM(size),0) FROM media_payloads) + (SELECT COALESCE(SUM(size),0) FROM media_uploads) + NEW.size > 400000000
BEGIN SELECT RAISE(ABORT, 'media capacity exceeded'); END;
CREATE TRIGGER IF NOT EXISTS media_capacity
BEFORE INSERT ON media_payloads
WHEN (SELECT COALESCE(SUM(size), 0) FROM media_payloads) + (SELECT COALESCE(SUM(size),0) FROM media_uploads WHERE key<>NEW.key) + NEW.size > 400000000
BEGIN
  SELECT RAISE(ABORT, 'media capacity exceeded');
END;
CREATE TABLE IF NOT EXISTS media_refs (
  owner_type TEXT NOT NULL CHECK (owner_type IN ('posts', 'portfolio')),
  owner_id TEXT NOT NULL,
  key TEXT NOT NULL REFERENCES media(key) ON DELETE RESTRICT,
  PRIMARY KEY (owner_type, owner_id, key)
);
CREATE INDEX IF NOT EXISTS media_refs_key ON media_refs(key);
INSERT OR IGNORE INTO media_refs
SELECT 'posts', posts.id, media.key FROM posts JOIN media ON instr(posts.data, '/media/' || media.key) > 0;
INSERT OR IGNORE INTO media_refs
SELECT 'portfolio', portfolio.id, media.key FROM portfolio JOIN media ON instr(portfolio.data, '/media/' || media.key) > 0;
CREATE TRIGGER IF NOT EXISTS posts_media_cleanup AFTER DELETE ON posts
BEGIN DELETE FROM media_refs WHERE owner_type='posts' AND owner_id=OLD.id; END;
CREATE TRIGGER IF NOT EXISTS portfolio_media_cleanup AFTER DELETE ON portfolio
BEGIN DELETE FROM media_refs WHERE owner_type='portfolio' AND owner_id=OLD.id; END;
