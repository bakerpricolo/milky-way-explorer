-- ─────────────────────────────────────────────────────────────────────────────
-- Milky Way Explorer – Supabase schema
-- Run this in the Supabase SQL editor, or place in supabase/migrations/
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Bookmarks table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookmarks (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,

  -- Gaia DR3 source_id (string to avoid int8 overflow in JS)
  star_id      TEXT        NOT NULL,
  star_name    TEXT,

  -- Astrometry cache (so bookmarks display without a Gaia round-trip)
  ra           DOUBLE PRECISION,
  dec          DOUBLE PRECISION,
  magnitude    DOUBLE PRECISION,
  temperature  DOUBLE PRECISION,
  distance_pc  DOUBLE PRECISION,

  -- User notes
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Uniqueness: one bookmark per (user, star)
CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_star_idx
  ON bookmarks (user_id, star_id);

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx
  ON bookmarks (user_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bookmarks
CREATE POLICY "Users read own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Users insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookmarks (e.g. edit notes)
CREATE POLICY "Users update own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);


-- ── Optional: enable Realtime so bookmarks sync across tabs ──────────────────
-- (Uncomment if you want live sync)
-- ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
