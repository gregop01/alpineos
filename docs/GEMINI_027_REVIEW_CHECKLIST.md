# Gemini 027 Additions — Manual Review Checklist

Migration 027 added 160 locations. Gemini hallucinated duplicates and wrong providers for many well-known spots. Use this checklist when reviewing.

**Already in DB before 027 (reference):**
- **Elfin Lakes Shelter** (bcparks) — migration 012/014, coords 49.7856, -122.9886
- **Sphinx Hut** (voc) — aka Burton Hut, Garibaldi Lake east shore
- **Harrison Hut** (voc) — Pemberton Icefield
- **Roland Burton Hut** (voc) — aka Sphinx Hut, Sphinx Bay
- **Julian Harrison Hut** (voc) — aka Harrison Hut
- **Kees and Claire Hut** (spearhead_huts) — at Russet Lake

---

## High priority — likely wrong / duplicates

### Elfin Lakes
- **Elfin Lakes** (bcparks) — ❌ Duplicate. Same as Elfin Lakes Shelter.
- **Elfin Lakes Shelter** (bcparks) — ⚠️ Already existed. 027 added more with varying coords; 014 has authoritative 49.7856, -122.9886.
- **Elfin Lakes Campground** (bcparks) — ❌ Not a separate site. Elfin Lakes is one facility (shelter + tent pads).
- **Elfin Lakes Hut** (bcparks, acc) — ❌ No separate hut. ACC doesn’t run Elfin Lakes; it’s BC Parks.

**Action:** Remove all Elfin Lakes additions except the canonical `Elfin Lakes Shelter` (bcparks) from 014.

### Garibaldi backcountry (Russet, Helm, Singing Pass, Taylor Meadows)
- **Russet Lake** vs **Russet Lake Campground** — Same place. BC Parks has one backcountry campground.
- **Helm Creek** vs **Helm Creek Campground** — Same place.
- **Singing Pass** vs **Singing Pass Campground** — Same place.
- **Taylor Meadows Campground** — Possibly valid; distinct from Helm Creek / Garibaldi Lake.

**Action:** Pick one canonical name per site. Merge or delete extras.

### Sphinx / Burton / Harrison (wrong providers)
- **Sphinx Hut** (pwa) — ❌ Wrong. Sphinx is VOC, not PWA.
- **Sphinx Hut** (voc) — Already exists from 012. 027 added extras with different coords.
- **Burton Hut** (pwa, bcmc, acc) — ❌ Wrong. Burton = VOC’s Sphinx Bay hut. Not PWA, BCMC, or ACC.
- **Harrison Hut** (bcmc) — ⚠️ Check. Harrison is VOC (Julian Harrison Hut). BCMC may have something else?

**Action:** Remove Sphinx/Burton from pwa, bcmc, acc. Keep only VOC entries.

### Plumper Cove
- **Plumper Cove Marine** vs **Plumper Cove Marine Park** — Same place. One is enough.

---

## Medium priority — verify before keeping

### Marine / coastal
- Sidney Spit, Smuggler Cove, Manzanita Hut (SCT), Tetrahedron Hut

### Parks Canada
- Floe Lake, Conrad Kain Hut, Mount Assiniboine Lodge

### Other huts
- Cayoosh Hut, Beekers Hut, Wendy Thompson Hut, Himmelsbach Hut, Sproatt Hut, Kees and Claire Hut (already in 012 — may be duplicate)

---

## Cleanup migration template

As you review, add DELETE statements for bad entries. Example:

```sql
-- Migration 028_cleanup_gemini_duplicates.sql (build as you review)

-- Remove wrong Elfin Lakes variants (keep only Elfin Lakes Shelter bcparks from 014)
DELETE FROM locations WHERE provider = 'bcparks' AND LOWER(name) IN (
  'elfin lakes', 'elfin lakes campground', 'elfin lakes hut'
) AND (metadata->>'coord_added_by') = 'gemini';

-- Remove wrong Sphinx/Burton providers (Sphinx/Burton are VOC only)
DELETE FROM locations WHERE (name = 'Sphinx Hut' OR name = 'Burton Hut')
  AND provider IN ('pwa', 'bcmc', 'acc')
  AND (metadata->>'coord_added_by') = 'gemini';

-- Add more as you verify...
```

---

## Coordinate corrections (24 total)

The **UPDATE** statements in 027 (coordinate corrections) are generally more reliable than the additions — centroid → actual campground. Still worth spot-checking a few (e.g. Bowron Lakes, Bugaboo, Tenedos Bay).
