-- Café Compass — schema
-- Run with: psql "$DATABASE_URL" -f db/schema.sql
--
-- Design notes:
--   * Scaled attributes (wifi/noise/outlets) are ENUMs, not free text —
--     keeps filtering type-safe and the query layer honest.
--   * Two many-to-many joins (vibes, collections) + one one-to-many (reviews).
--   * cafe_ratings is a VIEW so avg rating is always live, never denormalized.

DROP VIEW  IF EXISTS cafe_ratings          CASCADE;
DROP TABLE IF EXISTS collection_cafes       CASCADE;
DROP TABLE IF EXISTS collections            CASCADE;
DROP TABLE IF EXISTS reviews                CASCADE;
DROP TABLE IF EXISTS cafe_vibes             CASCADE;
DROP TABLE IF EXISTS vibes                  CASCADE;
DROP TABLE IF EXISTS cafes                  CASCADE;

DROP TYPE  IF EXISTS wifi_quality           CASCADE;
DROP TYPE  IF EXISTS noise_level            CASCADE;
DROP TYPE  IF EXISTS outlet_availability    CASCADE;

-- ── Enums ─────────────────────────────────────────────────────────────
CREATE TYPE wifi_quality        AS ENUM ('none', 'spotty', 'decent', 'strong', 'blazing');
CREATE TYPE noise_level         AS ENUM ('silent', 'quiet', 'moderate', 'lively', 'loud');
CREATE TYPE outlet_availability AS ENUM ('none', 'scarce', 'some', 'plenty');

-- ── Cafés ─────────────────────────────────────────────────────────────
CREATE TABLE cafes (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  neighborhood  TEXT NOT NULL,
  lat           NUMERIC(9,6) NOT NULL,
  lng           NUMERIC(9,6) NOT NULL,
  wifi          wifi_quality        NOT NULL,
  noise         noise_level         NOT NULL,
  outlets       outlet_availability NOT NULL,
  blurb         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Vibes (many-to-many) ──────────────────────────────────────────────
CREATE TABLE vibes (
  id     SERIAL PRIMARY KEY,
  label  TEXT NOT NULL UNIQUE
);

CREATE TABLE cafe_vibes (
  cafe_id  INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  vibe_id  INTEGER NOT NULL REFERENCES vibes(id) ON DELETE CASCADE,
  PRIMARY KEY (cafe_id, vibe_id)
);

-- ── Reviews (one-to-many) ─────────────────────────────────────────────
CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  cafe_id     INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  author      TEXT NOT NULL DEFAULT 'Anonymous',
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Collections (many-to-many) ────────────────────────────────────────
CREATE TABLE collections (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE collection_cafes (
  collection_id  INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  cafe_id        INTEGER NOT NULL REFERENCES cafes(id)       ON DELETE CASCADE,
  PRIMARY KEY (collection_id, cafe_id)
);

-- ── Live avg-rating view ──────────────────────────────────────────────
CREATE VIEW cafe_ratings AS
SELECT c.id AS cafe_id,
       COUNT(r.id)                       AS review_count,
       ROUND(AVG(r.rating)::numeric, 1)  AS avg_rating
FROM   cafes c
LEFT   JOIN reviews r ON r.cafe_id = c.id
GROUP  BY c.id;

-- ── Indexes for the filter query ──────────────────────────────────────
CREATE INDEX idx_cafes_wifi     ON cafes(wifi);
CREATE INDEX idx_cafes_noise    ON cafes(noise);
CREATE INDEX idx_cafes_outlets  ON cafes(outlets);
CREATE INDEX idx_reviews_cafe   ON reviews(cafe_id);
CREATE INDEX idx_cafe_vibes_vibe ON cafe_vibes(vibe_id);
