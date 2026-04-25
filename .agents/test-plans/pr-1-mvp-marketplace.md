# Test Plan — PR #1: MVP marketplace

Target: https://github.com/alirosta0057-collab/rapidgo/pull/1 (merged to `main`)
Tested against: local dev server at http://localhost:3000 with seeded SQLite DB.

## What changed (user-visible)

A brand-new Next.js 14 marketplace with 9 features. This plan proves the **core end-to-end money + logistics loop** — the riskiest and most integrated part. Features like ads/festivals (CRUD) and category management are visible in the UI but are ordinary CRUD on already-seeded data; they do not justify dedicated flows if the main loop works, since they share the same ORM / auth / role-guard plumbing.

## Primary adversarial flow — one recording, one full loop

Each step lists the **action**, **expected concrete result**, and **how a broken build would look different**.

### 1. Customer order with discount code

**Setup state:** cart empty; logged out.

1. Open `http://localhost:3000/restaurants/shamshiri` logged out.  
   **Expect:** page loads with menu items "چلوکباب کوبیده — 220,000 تومان", "چلوجوجه کباب — 240,000 تومان", "زرشک پلو با مرغ — 200,000 تومان" (seed values).  
   **Broken:** wrong prices, 404, or missing menu → fail.

2. Click **"افزودن"** on "چلوکباب کوبیده" × 2 and "چلوجوجه کباب" × 1.  
   **Expect:** cart badge shows `3` items.  
   **Broken:** cart count wrong or not persisted across navigation → fail.

3. Go to `/cart`, then `/checkout`.  
   **Expect:** redirected to `/login?callbackUrl=/checkout` (since not logged in).  
   **Broken:** checkout page renders without auth → security regression → fail.

4. Log in as `customer@market.local / customer1234`. Land on `/checkout`.  
   **Expect totals (exact):**
   - جمع آیتم‌ها: **680,000 تومان** (220000×2 + 240000×1)
   - کمیسیون سایت (10%): **68,000 تومان** (informational only; NOT added to customer total)
   - حق سرویس پیک: **20,000 تومان**
   - مبلغ قابل پرداخت: **700,000 تومان** (680000 + 20000 − 0)

   **Broken:** any wrong figure → commission math broken → fail.

5. Enter address `تهران، آزادی، پلاک ۱۰`, discount code `NOWRUZ20`, click **"اعمال"**.  
   **Expect:** "تخفیف" row appears with **− 136,000 تومان** (20% of 680,000). "قابل پرداخت" becomes **564,000 تومان**.  
   **Broken:** discount not applied or applied to wrong base (e.g., includes courier fee) → fail.

6. Click **"ثبت سفارش و پرداخت"**.  
   **Expect:** redirect to `/orders/<id>`, status badge "پرداخت شده" (Stripe not configured → mock PAID branch in `src/app/api/orders/route.ts:145-148`).  
   **Expect order detail section shows:**  
   - کمیسیون سایت: 68,000 تومان  
   - حق سرویس پیک: 20,000 تومان  
   - تخفیف (NOWRUZ20): − 136,000 تومان  
   - قابل پرداخت: 564,000 تومان  
   - تاریخچه وضعیت contains `در انتظار پرداخت` then `پرداخت شده`.  
   **Broken:** wrong total or missing mock-PAID event → fail.

**Capture order id** from URL for later steps.

### 2. Courier acceptance and three-stage state machine

1. Log out, log in as `courier@market.local / courier1234`. Open `/courier`.  
   **Expect:** page shows the PAID order under "سفارش‌های موجود برای پذیرش" with total 564,000 تومان.  
   **Broken:** order not appearing → courier listing filter broken → fail.

2. Click **"قبول سفارش"** on that order.  
   **Expect:** page reloads; order moves to "سفارش‌های در حال انجام شما" with status badge "پذیرفته شد" and a button "شروع تهیه".  
   **Broken:** stays in available list, or 403 → state machine or assignment broken → fail.

3. Click **"شروع تهیه"** → button becomes **"در راه (شروع حرکت)"**; status is "در حال تهیه".  
   Click again → button becomes **"تحویل شد"**; status is "پیک در راه".  
   **Broken:** button label does not progress through the three labels in that exact order, or server returns `cannot_advance` → `COURIER_NEXT_STATUS` map in `src/lib/roles.ts:32` is broken → fail.

   *Do not click "تحویل شد" yet — we want to prove live GPS updates while ON_THE_WAY.*

### 3. Live GPS tracking (courier → customer)

1. Still on `/courier`, click **"روشن کردن GPS"**.  
   **Expect:** status text changes to "آنلاین" with a lat/lng readout under it and a map tile with a marker.  
   **Broken:** stuck on "آفلاین" → `watchPosition` or POST `/api/courier/location` broken → fail.

2. *If the browser denies geolocation or returns no fix on the test VM:*  
   Open DevTools → **Sensors** → override location to `Tehran` (35.7000, 51.4000). Wait ≤ 5 seconds.  
   Verify the lat/lng readout on `/courier` updates to values near `(35.7000, 51.4000)`.  
   **Fallback (still valid proof):** if Sensors is unavailable, send a direct `POST /api/courier/location` from this same authenticated courier browser tab via DevTools console — this exercises the same server path that `watchPosition` uses.

3. **Verify server saved it:** check dev server log for `POST /api/courier/location 200`.

4. Switch to a second browser window/profile (or incognito) and log in as the customer. Open `/orders/<id>`.  
   **Expect:** "موقعیت پیک" card is visible with name "رضا پیک", a non-placeholder IP, and a Leaflet map with a marker.  
   **Broken:** card missing (no `courier.lastLat`) → GPS pipeline broken → fail.

5. Back on the courier window, change the simulated location to `(35.7100, 51.4100)`. Wait ≤ 10 seconds on the customer window (the tracker polls every 5s per `src/components/OrderTracker.tsx:30`).  
   **Expect:** the marker on the customer's `/orders/<id>` map visibly moves; lat/lng under "موقعیت پیک" on the courier page now reads ~(35.71, 51.41).  
   **Broken:** marker stays fixed → polling/response pipeline broken → fail.

### 4. Delivery completion and commission reporting

1. Back on courier window, click **"تحویل شد"** on the active order.  
   **Expect:** order leaves "در حال انجام" list. Customer `/orders/<id>` now shows "تحویل شد" and history contains a DELIVERED event.  
   **Broken:** wrong label or error → fail.

2. Log out, log in as `admin@market.local / admin1234`. Open `/admin/commissions`.  
   **Expect this order's row contains:** آیتم‌ها **680,000 تومان**, نرخ **10٪**, کمیسیون **68,000 تومان**, حق پیک **20,000 تومان**.  
   Summary cards include this order's amounts in "جمع کمیسیون سایت" and "جمع حق سرویس پیک".  
   **Broken:** order missing from table (likely because filter in `src/app/admin/commissions/page.tsx:8` excludes DELIVERED) or numbers mismatched → fail.

### 5. Access-control sanity check (Regression)

1. Still logged in as admin, open `/courier`.  
   **Expect:** courier dashboard loads (admin has elevated access) **or** a clean redirect — NOT a 500 or unauthenticated page.

2. Log out, log in as the same `customer@market.local`, and navigate to `/admin/commissions`.  
   **Expect:** redirect away (per `src/lib/requireRole.ts` guards).  
   **Broken:** commissions visible to a CUSTOMER → severe security regression → fail.

## Assertions summary (pass/fail scoreboard)

| # | Assertion | Expected |
|---|-----------|----------|
| A1 | Cart badge after adding 3 items | `3` |
| A2 | Checkout payable before discount | 700,000 تومان |
| A3 | Discount applied by NOWRUZ20 | − 136,000 تومان (20% of items subtotal only) |
| A4 | Checkout payable after discount | 564,000 تومان |
| A5 | Order created with status `PAID` (mock) | badge "پرداخت شده" |
| A6 | Courier can accept PAID order | badge moves to "پذیرفته شد" |
| A7 | Three-stage advance labels in order | "شروع تهیه" → "در راه (شروع حرکت)" → "تحویل شد" |
| A8 | Courier GPS online marker shows lat/lng | non-null on `/courier` |
| A9 | Customer sees moving marker on `/orders/<id>` | marker coords update within ~10s of courier move |
| A10 | Admin commission row for order | 680,000 / 10٪ / 68,000 / 20,000 |
| A11 | Customer cannot access `/admin/commissions` | redirect, no 200 HTML |

Each assertion is designed so a broken implementation produces a *visibly different* result (wrong number, missing badge, stuck marker, or 200 instead of redirect).

## Out of scope for this run

- Stripe live checkout (no keys supplied; mock-PAID path exercises the same order-state wiring, so this is acceptable coverage for MVP).
- Ads / festivals / category CRUD UIs — same role-guard and Prisma wiring as the tested admin pages.
- Restaurant onboarding (`/restaurant/setup`) — seed data already includes two approved restaurants; admin approval UI is a trivial boolean flip that would not be hidden by the more complex flows above passing.
