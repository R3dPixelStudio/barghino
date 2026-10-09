CREATE TABLE IF NOT EXISTS portfolio (id TEXT PRIMARY KEY, sort_order INTEGER NOT NULL, revision TEXT NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS portfolio_order ON portfolio(sort_order);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, revision TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS chat_limits (fingerprint TEXT NOT NULL, window INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(fingerprint, window));
