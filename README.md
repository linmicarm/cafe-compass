# Café Compass ☕🧭

A café discovery API for finding cozy, wifi-friendly workspaces. Filter cafés by **vibe**, **wifi quality**, **noise level**, and **outlet availability** — then read reviews and browse curated collections like *Deep Work Spots*.

Built to demonstrate **relational modeling in Postgres**: two many-to-many joins, a one-to-many, enum-typed filter columns, and a live aggregate view — all behind a clean Express API. Seed data is hand-authored around Columbus, OH neighborhoods.

> **Stack:** React + Vite · Leaflet · Node.js · Express · PostgreSQL (`pg`)
> **Scope:** v1 is user-less by design — reviews and collections are global. Accounts + auth are the headline stretch feature (see *If I built it again*).

The front end is a **map-led split view**: a Leaflet map and a filterable café list, linked bidirectionally — hover a card and its pin lifts; hover a pin and its card lifts; click either and the popup opens and the card scrolls into view. On mobile the split collapses to a Map/List toggle.

---

## Data model

```
cafes ──< reviews                         (one-to-many)
cafes >──< vibes        via cafe_vibes     (many-to-many)
cafes >──< collections  via collection_cafes (many-to-many)
cafe_ratings                               (VIEW: live avg rating + count)
```

Scaled attributes are Postgres **ENUMs**, not free text, so filtering stays type-safe:

| Attribute | Type | Values |
|---|---|---|
| `wifi` | `wifi_quality` | none · spotty · decent · strong · blazing |
| `noise` | `noise_level` | silent · quiet · moderate · lively · loud |
| `outlets` | `outlet_availability` | none · scarce · some · plenty |

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Data source | Hand-authored seed | Puts the relational modeling front and center instead of burying it in Places-API plumbing. One-live-signal pattern reused from Non-Place Detector. |
| Stack | Express + Postgres | Continues the full-stack pipeline; café data (tags, reviews, collections) is genuinely relational and models cleanly with joins. |
| Users / auth | Deferred to v2 | Every join type is already demonstrated without a users table. Auth adds surface area and a time sink, not a *new kind* of modeling. Scope discipline over sprawl. |
| Scaled attributes | ENUMs | Type-safe filtering; invalid values are rejected at the DB boundary, not in app code. |
| Avg rating | `VIEW`, not a column | Always live, never denormalized/stale. |
| Vibe filter | "any-of" via join | Café matches if it has ≥1 requested vibe — the natural UX for tag filtering. |

---

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/cafes` | List/filter cafés. Query params below. |
| `GET` | `/api/cafes/:id` | One café with vibes + full reviews. |
| `POST` | `/api/cafes/:id/reviews` | Add a review `{ author?, rating, body }`. |
| `GET` | `/api/collections` | List collections with café counts. |
| `GET` | `/api/collections/:id` | Collection + its cafés. |
| `POST` | `/api/collections/:id/cafes` | Add a café `{ cafe_id }`. |
| `GET` | `/api/vibes` | All vibes (for the filter UI). |

**Filter params** on `GET /api/cafes` (all optional, AND-combined, comma = any-of):

```
?wifi=strong,blazing
?noise=silent,quiet
?outlets=some,plenty
?vibe=cozy,minimal
?q=grandview            # name / neighborhood text search
```

Example:
```
GET /api/cafes?wifi=strong,blazing&noise=silent,quiet&outlets=plenty
→ the quiet, powered-up, fast-wifi deep-work cafés, sorted by rating
```

---

## Running locally

```bash
npm install
cp .env.example .env          # set DATABASE_URL
createdb cafe_compass         # or use an existing Postgres
npm run db:reset              # schema + seed
npm run dev                   # http://localhost:3000
```

`npm run db:reset` = `db:schema` (drop + create) then `db:seed` (hand-authored data).

### Front end

```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

The Vite dev server proxies `/api` to the Express backend on port 3000, so run the API first. Windows note: npm scripts that call `psql "$DATABASE_URL"` need the variable exported in the shell — `export DATABASE_URL="postgres://postgres:PASS@localhost:5432/cafe_compass"` — since npm on Windows doesn't auto-load `.env` for plain shell commands.

---

## Problems → Fix → Lesson

**Problem:** Binding an array of user-supplied strings to an enum column (`c.wifi = ANY($1)`) throws a type-mismatch — Postgres won't coerce `text[]` to `wifi_quality[]` implicitly.
**Fix:** Cast explicitly in the query: `$1::text[]::wifi_quality[]`, with values still bound (never interpolated).
**Lesson:** Enums buy type-safety at the DB boundary, but you have to spell out the cast on the way in. The values stay parameterized, so it's safe.

**Problem:** Adding the vibe filter as a `JOIN` duplicated café rows (one per matching vibe), inflating results.
**Fix:** Kept the *filter* join separate from the *display* join and de-duplicated with `ARRAY_AGG(DISTINCT ...)` + `GROUP BY c.id`.
**Lesson:** A join used for filtering and a join used for aggregating the same relation are two different jobs — don't make one join do both.

**Problem:** The Leaflet map rendered grey in the split layout, and again each time the mobile Map/List toggle revealed it.
**Fix:** A small `SizeFixer` component calls `map.invalidateSize()` on mount and whenever the view changes, so Leaflet re-measures its (now visible) container.
**Lesson:** Leaflet measures its container once at init — any time the map starts hidden or resizes (grid, flex, tab toggle), it needs an `invalidateSize()` nudge. Same bug family as the grid-layout grey map from Non-Place Detector.

**Problem:** Map↔list hover/select could have meant two components each owning their own state and drifting out of sync.
**Fix:** Lifted `hoveredId` and `selectedId` into `App` as the single source of truth; both the card list and the map read and write the same state.
**Lesson:** Bidirectional UI sync isn't two-way binding — it's one shared state that two views both render from.

---

## What I learned

- **ENUMs + array filters** — type-safe "any-of" filtering needs an explicit `text[]::enum[]` cast, and the values stay bound.
- **Views for aggregates** — `cafe_ratings` keeps average rating live without denormalizing a column that would drift out of sync.
- **`ARRAY_AGG ... FILTER (WHERE ...)`** — the clean way to collapse a many-to-many into an array field per row without `NULL` noise.
- **Separating filter joins from display joins** — the fix for row-multiplication when a query both filters *and* aggregates the same relation.

---

## If I built it again

- **Users + auth** — the real v2. Reviews and collections become per-user; adds ownership checks and protected routes. Deferred deliberately so v1 could ship tight.
- **Distance sort** — `?near=lat,lng` with a Haversine (or PostGIS) ordering, since lat/lng are already stored.
- **Full-text search** — swap the `ILIKE` café search for a `tsvector` index once the dataset grows past a single city.
- **Rating filter** — `?minRating=4`, easy now that `cafe_ratings` exists.
