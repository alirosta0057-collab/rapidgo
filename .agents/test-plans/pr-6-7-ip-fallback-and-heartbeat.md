# Test plan — PR #6 (IP fallback) + PR #7 (live heartbeat)

## What we are proving

The user accuses the courier panel of being "hardcoded on IP" and demands proof
that the live tracking is real and behaves the same way as the smart-city
reference app at https://smart-city-x4qb.onrender.com/.

**The truth, before testing:**

1. `smart-city`'s landing page string `Detected · Tehran, Iran  35.689°N, 51.389°E`
   is **static HTML demo text** on the marketing page. It is not real-time IP
   geolocation. Verified by fetching the raw HTML and finding the literal
   string baked into the page body. This is a marketing page, not a working
   tracking system.

2. Our `/api/courier/location/ip` route in `src/app/api/courier/location/ip/route.ts`
   does **real** IP geolocation:
   - Reads `x-vercel-ip-latitude` / `x-vercel-ip-longitude` headers (set by
     Vercel's edge based on the inbound IP)
   - Falls back to `https://ipapi.co/<ip>/json/` if the Vercel headers are
     missing
   - Persists each lookup to `CourierProfile` and appends a row to
     `CourierLocation`
   - Returns 503 `geo_unavailable` if both lookups fail (so the UI can show an
     honest error rather than a hardcoded coordinate)

3. The "live tracking" is real `navigator.geolocation.watchPosition(...)` —
   every browser-emitted GPS fix calls `handlePosition` which:
   - Updates `pos` state → marker moves on the Leaflet map
   - Increments `updateCount`
   - Resets `lastUpdatedAt` to `Date.now()` → the "X ثانیه پیش" counter
     resets to 0 and starts climbing again
   - POSTs to `/api/courier/location` for server-side persistence

If the code were hardcoded to an IP coordinate, none of those visible
heartbeat values would respond to deterministic `watchPosition` inputs.

## Environment

- Production URL: https://rapidgo-w87v.vercel.app
- Both PR #6 and PR #7 are merged to `main` (commits `a6e8378`, `dfc44bc`).
  CI was green on both; production has been redeployed.
- Test account: `courier@market.local` / `courier1234`
- Browser: Chrome on the Devin VM desktop.
- GPS will be controlled deterministically using **Chrome DevTools →
  More tools → Sensors → Location** (set custom lat/lng or "Location
  unavailable" to simulate denial).

## Test cases (executed sequentially in one screen recording)

### Case 0 — Smart-city baseline (regression / honesty check)

**Procedure**
1. Open https://smart-city-x4qb.onrender.com/ in Chrome.
2. Open DevTools → Elements → search for `35.689` in the rendered DOM.

**Expected**
- The string `35.689°N, 51.389°E` is **hard-coded literal text** in the
  page HTML. Not the result of any geolocation API call.

**Why this matters**
- Disproves the user's premise that smart-city is "doing live IP geolocation
  and we are not". Both are showing ~Tehran-center. The difference is that
  ours is a real call against the real edge headers; theirs is static demo
  copy.

### Case 1 — IP fallback when GPS is denied (PR #6)

**Procedure**
1. Open https://rapidgo-w87v.vercel.app/courier in a fresh Chrome incognito
   window. Login as `courier@market.local`.
2. DevTools → Sensors → Location → choose **"Location unavailable"**.
3. Click **روشن کردن GPS**.

**Expected**
- Status flips to `آنلاین (تقریبی از IP)`
- Coordinates display under the status (latitude, longitude with 5 decimals)
- Marker is placed on the Leaflet map at those coordinates
- Heartbeat line shows: `آخرین به‌روزرسانی: 0 ثانیه پیش — تعداد کل: 1`
- Amber warning text mentions "هر ۳۰ ثانیه refresh می‌شود"

**Failure modes**
- If status stays `آفلاین` or coordinates are missing → IP fallback is broken.
- If amber warning is missing → PR #7 changes did not deploy.

### Case 2 — Heartbeat is real, not hardcoded (PR #7)

**Procedure**
1. Continue from Case 1 (IP fallback active).
2. Wait ~10 seconds without doing anything.

**Expected**
- The number in `آخرین به‌روزرسانی: <N> ثانیه پیش` increments every second
  (visible on the recording — 0, 1, 2, …, 10).
- After 30 seconds, the counter resets to 0 and `تعداد کل` increments
  to 2 (the automatic IP refresh interval).

**Why this matters**
- A hardcoded coordinate cannot increment a counter on its own. The visible
  ticker proves a real `setInterval` is firing on a real timer, and the
  count increments only when a real network round-trip succeeds.

### Case 3 — Live GPS, deterministic override sequence (PR #7)

**Procedure**
1. DevTools → Sensors → Location → switch from "Location unavailable" to
   **"Other…"** and enter `35.7000, 51.4100`.
2. Click **روشن کردن GPS** if not already tracking. (If button shows
   "خاموش کردن GPS" tracking is already on — skip click.)
3. Wait ~3 seconds for a fix.
4. Switch override to `35.6800, 51.3800`. Wait ~3 seconds.
5. Switch override to `35.7200, 51.4400`. Wait ~3 seconds.

**Expected for each override**
- Status flips to `آنلاین (GPS دقیق)`
- Coordinate display under the status updates to the override values
  (within rounding to 5 decimals)
- Marker on the Leaflet map jumps to the override location
- `تعداد کل` increments by at least 1 each time
- `آخرین به‌روزرسانی` resets to 0 when the new fix arrives, then ticks up
- `دقت GPS: <Ym>` appears (Chrome reports a synthetic accuracy for sensor
  overrides)
- Green text `ردیابی زنده فعال است` is visible

**Failure modes**
- If marker doesn't move when the override changes → `watchPosition` is
  not wired up to React state, or `Recenter` component isn't re-mounting.
- If `تعداد کل` doesn't change → `handlePosition` isn't being called.
- If coordinates shown stay the same as Case 1's IP coords → the GPS path
  is broken and the IP coords are masking it (this is the "hardcoded"
  accusation; we explicitly disprove this here).

### Case 4 — Server-side persistence

**Procedure**
1. After Case 3, in DevTools Network tab, filter by `location`.
2. Inspect the `POST /api/courier/location` requests.

**Expected**
- One POST per GPS fix with body `{lat, lng}` matching the override.
- Earlier in Case 1, one POST to `/api/courier/location/ip` with empty body
  and 200 response containing `{lat, lng, city, source: "ip"}`.

**Why this matters**
- Proves the data isn't only client-side. Each fix is persisted to the
  database.

### Case 5 — IP route is honest about failure (defensive)

**Procedure**
1. In a fresh incognito tab, with no auth, `curl -X POST https://rapidgo-w87v.vercel.app/api/courier/location/ip`.

**Expected**
- HTTP 403 `{"error":"forbidden"}`. Confirms the route requires a courier
  session and isn't a public hardcoded coordinate emitter.

## Recording deliverable

A single Chrome screen recording covering Cases 0–4 in order, with these
annotations:

- `setup` — "Login as courier@market.local on production"
- `test_start` — "It should show smart-city's '35.689°N, 51.389°E' is static HTML"
- `assertion` (passed/failed) — "smart-city Tehran coords are hard-coded demo text"
- `test_start` — "It should fall back to IP geo when GPS is denied"
- `assertion` — "Status: آنلاین (تقریبی از IP); marker at IP coords; count=1"
- `test_start` — "It should tick the seconds-ago counter every second"
- `assertion` — "Counter increments 0→1→2→…→10 over 10 seconds"
- `test_start` — "It should auto-refresh IP location every 30s"
- `assertion` — "After 30s, count increments and seconds-ago resets"
- `test_start` — "It should track live GPS with marker movement on each override"
- `assertion` — "Override #1 35.7000,51.4100: marker moves, count++"
- `assertion` — "Override #2 35.6800,51.3800: marker moves, count++"
- `assertion` — "Override #3 35.7200,51.4400: marker moves, count++"
- `assertion` — "POST /api/courier/location body matches override coords"

## What this recording will NOT prove

- It will not prove anything about iOS Safari's permission-cache behavior on
  the user's specific iPhone. That is an Apple-level UX limitation and is
  out of scope for code-level proof. The user can verify on their iPhone by
  using Chrome iOS or by clearing only this site's data in Safari Settings →
  Advanced → Website Data.

## Acceptance criterion

The user should be able to watch the recording and see, in order:
1. smart-city's "live IP" string is literally hardcoded text (not a working API call).
2. Our app, when GPS is denied, calls a real API that returns coordinates
   from the inbound IP and shows them on a map.
3. Our app, when GPS is allowed via a deterministic DevTools override, picks
   up every override and visibly moves the marker, increments the count,
   and resets the seconds-ago counter — exactly as a real `watchPosition`
   subscriber should.

If any of those visible behaviors fail to occur on the recording, the test
fails and the user's accusation has merit.
