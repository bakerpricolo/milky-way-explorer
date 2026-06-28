-- ─────────────────────────────────────────────────────────────────────────────
-- 002_stars.sql
-- Pre-loaded Gaia DR3 star catalog table.
-- Run in Supabase SQL Editor after 001_schema.sql.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stars (
  source_id           TEXT             PRIMARY KEY,
  ra                  DOUBLE PRECISION NOT NULL,   -- degrees, J2000
  dec                 DOUBLE PRECISION NOT NULL,   -- degrees, J2000
  parallax            DOUBLE PRECISION,            -- mas
  parallax_over_error DOUBLE PRECISION,
  pmra                DOUBLE PRECISION,            -- proper motion RA  (mas/yr)
  pmdec               DOUBLE PRECISION,            -- proper motion Dec (mas/yr)
  phot_g_mean_mag     DOUBLE PRECISION,            -- Gaia G magnitude
  bp_rp               DOUBLE PRECISION,            -- BP-RP colour index
  teff_val            DOUBLE PRECISION,            -- effective temperature (K)
  radial_velocity     DOUBLE PRECISION,            -- km/s
  l                   DOUBLE PRECISION,            -- galactic longitude (degrees)
  b                   DOUBLE PRECISION             -- galactic latitude  (degrees)
);

-- Fast queries by brightness and distance
CREATE INDEX IF NOT EXISTS stars_mag_idx       ON stars (phot_g_mean_mag ASC);
CREATE INDEX IF NOT EXISTS stars_parallax_idx  ON stars (parallax DESC);

-- Stars are publicly readable (no auth needed to explore the galaxy)
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stars are publicly readable"
  ON stars FOR SELECT
  USING (true);
