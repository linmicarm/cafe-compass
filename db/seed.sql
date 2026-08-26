-- Café Compass — seed data
-- Run with: psql "$DATABASE_URL" -f db/seed.sql
-- Hand-authored set grounded in Columbus, OH neighborhoods.
-- (Cafés are representative/fictionalized for portfolio use.)

SET client_encoding TO 'UTF8';  -- so accented chars (café) load right on any OS

TRUNCATE collection_cafes, collections, reviews, cafe_vibes, vibes, cafes
  RESTART IDENTITY CASCADE;

-- ── Vibes ─────────────────────────────────────────────────────────────
INSERT INTO vibes (label) VALUES
  ('cozy'), ('minimal'), ('industrial'), ('plant-filled'),
  ('bright'), ('dark-academia'), ('bustling'), ('tucked-away');

-- ── Cafés ─────────────────────────────────────────────────────────────
INSERT INTO cafes (name, neighborhood, lat, lng, wifi, noise, outlets, blurb) VALUES
  ('Fox in the Snow',      'Italian Village', 39.985300, -82.998900, 'spotty',  'lively',   'scarce', 'Beautiful bakery-forward space; come for the egg sandwich, not the outlets.'),
  ('Stauf''s Grandview',   'Grandview',       39.979800, -83.041200, 'strong',  'moderate', 'some',   'Long-running local roaster with a steady weekday work crowd.'),
  ('Mission Coffee',       'Short North',     39.976500, -83.001100, 'decent',  'moderate', 'plenty', 'Airy industrial room, big communal table, reliable power.'),
  ('One Line Coffee',      'Short North',     39.972200, -83.001800, 'strong',  'lively',   'some',   'Precise pour-overs; buzzier at the counter, calmer in back.'),
  ('Kittie''s Cakes',      'German Village',  39.951200, -82.996700, 'decent',  'quiet',    'scarce', 'Tiny and sweet — better for a focused hour than a full day.'),
  ('Cafe Brioso',          'Downtown',        39.961000, -82.998300, 'strong',  'moderate', 'plenty', 'Downtown workhorse; quiet mid-afternoon lull is prime focus time.'),
  ('Roosevelt Coffee',     'Downtown',        39.965400, -82.996100, 'strong',  'quiet',    'plenty', 'Nonprofit café, calm mission-driven room, excellent for deep work.'),
  ('Backroom Coffee',      'Clintonville',    40.041800, -83.014500, 'decent',  'quiet',    'some',   'Neighborhood spot down a side street; regulars and slow mornings.'),
  ('Crimson Cup',          'Clintonville',    40.047900, -83.016200, 'strong',  'lively',   'some',   'Bright and busy; great coffee, bring headphones.'),
  ('Winans Chocolates',    'Powell',          40.157300, -83.075100, 'decent',  'moderate', 'scarce', 'Chocolate-and-coffee hybrid; charming but not a laptop marathon room.'),
  ('Impero Coffee',        'Grandview',       39.983900, -83.038700, 'strong',  'quiet',    'plenty', 'Minimalist white room, near-silent afternoons, outlets on every wall.'),
  ('Yeah, Me Too',         'Franklinton',     39.957600, -83.021900, 'blazing', 'moderate', 'plenty', 'Design-forward Franklinton space built for people with laptops.');

-- ── Café ↔ Vibe joins ─────────────────────────────────────────────────
-- vibe ids: 1 cozy, 2 minimal, 3 industrial, 4 plant-filled,
--           5 bright, 6 dark-academia, 7 bustling, 8 tucked-away
INSERT INTO cafe_vibes (cafe_id, vibe_id) VALUES
  (1,1),(1,7),(1,5),
  (2,1),(2,7),
  (3,3),(3,5),
  (4,3),(4,7),
  (5,1),(5,8),
  (6,5),(6,7),
  (7,1),(7,2),
  (8,1),(8,8),(8,4),
  (9,5),(9,7),
  (10,1),(10,8),
  (11,2),(11,5),
  (12,3),(12,2),(12,5);

-- ── Reviews ───────────────────────────────────────────────────────────
INSERT INTO reviews (cafe_id, author, rating, body) VALUES
  (1, 'Dana',   4, 'Gorgeous space and incredible pastries, but I fought for a seat and never found an outlet.'),
  (1, 'Priya',  5, 'Worth it for a short session. The light in the morning is unreal.'),
  (3, 'Marcus', 5, 'The communal table is my default desk now. Power everywhere, easy to focus.'),
  (3, 'Lena',   4, 'Solid wifi, good hum of activity without being loud.'),
  (6, 'Sam',    4, 'Dead quiet around 3pm. Got two hours of real work done.'),
  (7, 'Jordan', 5, 'Calmest room downtown and the mission behind it makes the coffee taste better.'),
  (7, 'Alex',   5, 'My go-to for deep work. Never loud, always an open outlet.'),
  (9, 'Riley',  3, 'Great coffee, but too lively for calls. Fine with headphones.'),
  (11,'Toni',   5, 'Almost too quiet — in the best way. Minimalist and outlet-rich.'),
  (11,'Chris',  5, 'This is the one. Silent afternoons, strong wifi, whole walls of plugs.'),
  (12,'Morgan', 5, 'Built for remote workers. Fast wifi, tons of power, good desk height.'),
  (12,'Kai',    4, 'Excellent setup for laptops; gets a little busier at lunch.');

-- ── Collections ───────────────────────────────────────────────────────
INSERT INTO collections (name, description) VALUES
  ('Deep Work Spots',   'Quiet rooms with strong wifi and reliable outlets.'),
  ('Pastry & A Laptop', 'Come for the food, stay for a focused hour.'),
  ('Weekend Wandering', 'Bright, bustling rooms that are fun even when you''re not working.');

INSERT INTO collection_cafes (collection_id, cafe_id) VALUES
  (1, 7), (1, 11), (1, 12), (1, 6),
  (2, 1), (2, 5), (2, 10),
  (3, 3), (3, 4), (3, 9);
