-- ============================================
-- XTE API — Supabase Schema
-- Jalankan di Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  email            TEXT        UNIQUE NOT NULL,
  password_hash    TEXT        NOT NULL,
  api_key          TEXT        UNIQUE,
  is_verified      BOOLEAN     NOT NULL DEFAULT false,
  otp_code         TEXT,
  otp_expires_at   TIMESTAMPTZ,
  otp_resend_count INTEGER     NOT NULL DEFAULT 0,
  otp_resend_hour  TIMESTAMPTZ,
  total_requests   INTEGER     NOT NULL DEFAULT 0,
  today_requests   INTEGER     NOT NULL DEFAULT 0,
  last_request_date DATE,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_users_email   ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users (api_key);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security (opsional, pakai service key = bypass)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
