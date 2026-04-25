# Test Report — PR #1: MVP marketplace

**PR:** https://github.com/alirosta0057-collab/rapidgo/pull/1 (merged)
**Session:** https://app.devin.ai/sessions/3b7a3ee460f84e6d964f0b3d757ef24e
**Target:** local dev server `http://localhost:3000` with seeded SQLite DB
**Recording:** [MVP Marketplace E2E Test — 11 assertions](https://app.devin.ai/attachments/95aa9950-6150-449d-90a3-91d4c83aa001/rec-0a154a22-3423-4714-9194-2a316634cb63-subtitled.mp4)

## Summary

Ran the full end-to-end money + logistics loop against the local dev server: customer places a 3-item order at Shamshiri, applies `NOWRUZ20` discount, order is marked PAID (Stripe not configured → mock branch), courier accepts and progresses through the 3-stage state machine, courier GPS coordinates are posted and the customer map marker moves in under 10 s, courier marks DELIVERED, admin commission report shows the row with correct numbers, and a CUSTOMER is denied `/admin/commissions`. **All 11 assertions passed.**

Test automation note: I drove a subset of DOM button clicks through CDP (`button.click()`) because native-event GUI clicks did not always register reliably on this VM — this still hits the real React `onClick` handlers and the real API routes, so it is a valid end-to-end exercise. Every assertion was also verified via a subsequent GUI screenshot or a server response.

Out of scope (unchanged from test plan): real Stripe checkout (no keys), ad/festival/category CRUD UIs (trivial role-guarded CRUD), restaurant onboarding (seed already contains approved restaurants).

## Assertion scoreboard

| # | Assertion | Result |
|---|-----------|--------|
| A1 | Cart contains 2×چلوکباب کوبیده (220k) + 1×چلوجوجه کباب (240k); badge `3` | passed |
| A2 | Checkout payable before discount = 700,000 (680k items + 20k courier) | passed |
| A3 | Unauthenticated `/checkout` → `/login?callbackUrl=/checkout` | passed |
| A4 | `NOWRUZ20` applies −136,000 تومان (20% of 680k items only) | passed |
| A5 | Order created with badge "پرداخت شده"; events: `در انتظار پرداخت` → `پرداخت شده` | passed |
| A6 | Courier accepts PAID order; moves to "در حال انجام"; badge "پذیرفته شد" | passed |
| A7 | 3-stage progression: `شروع تهیه` → `در راه (شروع حرکت)` → `تحویل شد` with statuses `در حال تهیه`, `پیک در راه` | passed |
| A8 | `POST /api/courier/location` returns 200; `GET` returns `{lastLat:35.7,lastLng:51.4,isOnline:true}` | passed |
| A9 | After posting `(35.71, 51.41)`, customer `/orders/<id>` marker visibly moved within ~7 s (tracker polls 5 s) | passed |
| A10 | Admin `/admin/commissions` row: آیتم‌ها 680,000 / نرخ 10٪ / کمیسیون 68,000 / حق پیک 20,000; summaries match | passed |
| A11 | CUSTOMER GET `/admin/commissions` → HTTP 307 redirect to `/` (no 200 HTML body returned) | passed |

## Evidence

### A1 — Cart after 3 items added
2×چلوکباب کوبیده = 440,000 + 1×چلوجوجه کباب = 240,000 → جمع آیتم‌ها 680,000 تومان. Badge in header shows `3`.

![cart](https://app.devin.ai/attachments/c1f70ef5-5c72-47e1-b943-515a3d7dea3d/screenshot_38c846b4719945a2a6aa0033be9ff9d2.png)

### A2–A4 — Checkout before & after NOWRUZ20

| Before discount (700,000) | After NOWRUZ20 (564,000) |
|---|---|
| (see merged screenshot below) | ![checkout after discount](https://app.devin.ai/attachments/397ef9bf-4424-4315-9b3d-51c5b00dc603/screenshot_c04310bc83ce48288188008b3eddc821.png) |

Discount row: **− 136,000 تومان**, مبلغ قابل پرداخت: **564,000 تومان**. Commission (68,000) and courier fee (20,000) are informational; discount correctly applies to items subtotal only.

### A5 — Order detail with mock PAID status
![order detail](https://app.devin.ai/attachments/6af68f40-c656-4fc3-bc6c-1738a5fd579e/screenshot_9df59fc31c054e2bbd100cc278d9907b.png)

Badge "پرداخت شده"; breakdown matches; events show `در انتظار پرداخت` then `پرداخت شده`.

### A6–A7 — Courier accept and 3-stage state machine

| Before accept (available list) | After accept → "شروع تهیه" | After 2 advances → "تحویل شد" / پیک در راه |
|---|---|---|
| ![courier available](https://app.devin.ai/attachments/83b895ac-a43d-4ca4-903e-e9b580cdf147/screenshot_34aff3939e21421a96f16518c8ef816c.png) | ![courier accepted](https://app.devin.ai/attachments/bde84c37-52ef-4047-9750-445127fbd018/screenshot_56a1a45295374d49b339c198856b0b7c.png) | (see recording) |

### A8–A9 — Live GPS pipeline

`POST /api/courier/location {lat:35.7, lng:51.4}` → 200. Customer `/orders/<id>` renders "موقعیت پیک" with marker:

![customer map initial](https://app.devin.ai/attachments/b1ffd487-5e5c-4886-a3d5-b9d80f2e3a86/screenshot_7f5970fe98844a7bb8ab49c314e62a91.png)

After `POST {lat:35.71, lng:51.41}` (~1 km NE), the marker visibly moved after the next 5 s poll tick (screenshot taken ~7 s after POST):

![customer map moved](https://app.devin.ai/attachments/c226492f-919d-4c66-bee7-2dc16e4399b6/screenshot_f9802adef2bb4b68a7e7b796ef7deb78.png)

Side-by-side: the visible streets, block numbers, and marker position are different — the map re-centered to the new lat/lng.

### A10 — Admin commission report after delivery
After courier `{action:"deliver"}` → order status DELIVERED, customer sees badge "تحویل شد":

![customer delivered](https://app.devin.ai/attachments/93acd1e0-1798-421c-a6d5-d6d01e8c1f46/screenshot_e105fe74b8c4432ebb3ca0206827ee50.png)

Admin commission report:

![admin commissions](https://app.devin.ai/attachments/b8caa60d-147d-499e-a9f8-0aa5819e214e/screenshot_aa7f4af1fe434aeab972e93005b108f3.png)

Summary cards: جمع فروش 680,000 / کمیسیون سایت 68,000 / حق سرویس پیک 20,000. Row: hkqh9u# / رستوران شمشیری / 680,000 / 10٪ / 68,000 / 20,000.

### A11 — Customer denied /admin/commissions
Logged in as `customer@market.local`, direct `GET /admin/commissions` returned `HTTP 307 Location: /` (not 200 HTML). Verified server-side via cookie-jar request.

## Test accounts used (seeded)
- Customer: `customer@market.local` / `customer1234`
- Courier: `courier@market.local` / `courier1234`
- Admin: `admin@market.local` / `admin1234`

## Environment
- Node + pnpm, Next.js 14 dev server on :3000
- SQLite `prisma/dev.db`, seeded via `pnpm db:seed`
- NEXTAUTH_SECRET set; Stripe keys intentionally absent (mock-PAID branch exercised)
- COMMISSION_RATE=0.10, COURIER_SERVICE_FEE=20000
