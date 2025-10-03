-- Create KV Store table for Supabase-based key-value storage
-- This replaces Vercel KV functionality

CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_kv_store_expires_at ON kv_store(expires_at) WHERE expires_at IS NOT NULL;

-- Index for pattern matching
CREATE INDEX IF NOT EXISTS idx_kv_store_key_pattern ON kv_store(key text_pattern_ops);

-- Function to clean up expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_kv()
RETURNS void AS $$
BEGIN
  DELETE FROM kv_store WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to run cleanup periodically (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-kv', '*/5 * * * *', 'SELECT cleanup_expired_kv()');
