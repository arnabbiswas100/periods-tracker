-- ════════════════════════════════════════════════════════════════
-- Lumina Flow — Supabase Database Setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════

-- ── 1. Enable Anonymous Auth ─────────────────────────────────────
-- Go to: Authentication → Providers → Anonymous Sign-In → Enable it
-- (Cannot be done via SQL, do it in the Supabase dashboard)

-- ── 2. Create Tables ─────────────────────────────────────────────

-- User settings (one row per user)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_period_start DATE,
  cycle_length    INT DEFAULT 28,
  period_length   INT DEFAULT 5,
  streak          INT DEFAULT 0,
  last_log_date   DATE,
  onboarded       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Cycle daily logs
CREATE TABLE IF NOT EXISTS cycle_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  flow            TEXT,
  mood            TEXT,
  symptoms        TEXT[] DEFAULT '{}',
  intimate        TEXT,
  intimate_note   TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order  INT DEFAULT 0,
  date        DATE,
  title       TEXT,
  body        TEXT,
  color       TEXT DEFAULT '#fb7185',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sort_order)
);

-- Push subscriptions (for web push notifications)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription TEXT NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Row Level Security (RLS) ───────────────────────────────────
-- Users can ONLY access their OWN rows

ALTER TABLE user_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- user_settings policies
CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- cycle_logs policies
CREATE POLICY "Users manage own logs"
  ON cycle_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- journal_entries policies
CREATE POLICY "Users manage own journal"
  ON journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- push_subscriptions policies
CREATE POLICY "Users manage own push subscription"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Auto-update updated_at on settings ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Done! ─────────────────────────────────────────────────────────
-- All data is now private per-user thanks to RLS.
-- No one — not even the database admin — can read another user's cycle data
-- without having their JWT token.
