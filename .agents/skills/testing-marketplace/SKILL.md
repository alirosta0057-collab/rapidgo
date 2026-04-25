# Testing the rapidgo marketplace (Next.js + Prisma + NextAuth)

This skill captures the end-to-end test procedure for the MVP marketplace and the
VM-specific workarounds that made it reliable.

## Devin secrets needed

None for local testing. Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
are optional — when absent, `POST /api/orders` takes the mock-PAID branch
(`src/app/api/orders/route.ts`), which still exercises the full downstream wiring
(order events, courier pickup, admin commission).

## One-shot setup

```bash
cd /home/ubuntu/repos/super-market
cp -n .env.example .env 2>/dev/null || true
# Ensure .env contains at minimum:
#   DATABASE_URL="file:./dev.db"
#   NEXTAUTH_URL="http://localhost:3000"
#   NEXTAUTH_SECRET="test-secret-for-devin-local-testing-0123456789"
#   NEXT_PUBLIC_SITE_NAME="مارکت سوپر"
#   COMMISSION_RATE="0.10"
#   COURIER_SERVICE_FEE="20000"
pnpm install
pnpm prisma migrate deploy || pnpm prisma db push
pnpm db:seed
pnpm dev   # runs on :3000
```

## Seeded accounts and data (stable across reseeds)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@market.local` | `admin1234` |
| Customer | `customer@market.local` | `customer1234` |
| Courier | `courier@market.local` | `courier1234` |
| Restaurant owner | `owner@market.local` | `restaurant1234` |

Seeded restaurants:
- `رستوران شمشیری` (slug: `shamshiri`) — چلوکباب کوبیده 220,000 / چلوجوجه کباب 240,000 / زرشک پلو با مرغ 200,000
- `برگرهاوس` (slug: `burger-house`)

Discount code: `NOWRUZ20` — 20 % off items subtotal only (not courier fee), active.

Primary golden-path numbers (cart = 2×220k + 1×240k):

| Field | Value |
|---|---|
| جمع آیتم‌ها | 680,000 |
| حق سرویس پیک | 20,000 |
| قابل پرداخت (no discount) | **700,000** |
| Discount (NOWRUZ20 on items) | −136,000 |
| قابل پرداخت (with NOWRUZ20) | **564,000** |
| کمیسیون سایت (10 %) | 68,000 (informational; not added to customer total) |

## Running the golden-path loop

1. **Customer order with discount**
   - Visit `/restaurants/shamshiri` logged out → add 2×چلوکباب کوبیده + 1×چلوجوجه کباب
   - Visit `/checkout` → expect redirect to `/login?callbackUrl=/checkout`
   - Login as customer; verify payable = **700,000** (before discount)
   - Apply `NOWRUZ20`; verify −136,000 row and payable = **564,000**
   - Submit → redirect to `/orders/<id>` with badge "پرداخت شده"
2. **Courier acceptance + 3-stage state machine**
   - Login as courier; order appears under "سفارش‌های موجود برای پذیرش"
   - Click `قبول سفارش` → badge "پذیرفته شد", button becomes "شروع تهیه"
   - Click → status "در حال تهیه", button becomes "در راه (شروع حرکت)"
   - Click → status "پیک در راه", button becomes "تحویل شد" *(pause here; do not click yet if you want to prove GPS)*
3. **Live GPS**
   - `POST /api/courier/location { lat, lng }` as courier → 200
   - Customer `/orders/<id>` shows "موقعیت پیک" with Leaflet marker; `OrderTracker` polls every 5 s (`src/components/OrderTracker.tsx:30`)
   - Change lat/lng → customer marker moves within ~7 s
4. **Deliver and admin commissions**
   - `POST /api/orders/<id>/status { action: "deliver" }` as courier
   - Login as admin; `/admin/commissions` must show the order row with
     `آیتم‌ها=680,000 / نرخ=10٪ / کمیسیون=68,000 / حق پیک=20,000`
5. **Access control sanity**
   - Customer GET `/admin/commissions` must return HTTP 307 → `/` (not 200 HTML)

## API shapes (do NOT guess — these are the real contracts)

- `POST /api/auth/callback/credentials` — form-urlencoded with `csrfToken` (from `/api/auth/csrf`), `email`, `password`, `callbackUrl`
- `POST /api/orders` — JSON body `{ items:[{menuItemId,quantity}], address, promotionCode, notes }` → `{orderId, checkoutUrl}` (checkoutUrl is null in mock-PAID branch)
- `POST /api/courier/location` — JSON `{lat, lng}`; requires COURIER session. Responds `{ok:true}`.
- `GET /api/courier/location?orderId=<id>` — public; returns `{lastLat,lastLng,lastIp,lastSeenAt,isOnline}`
- `POST /api/orders/<id>/status` — JSON `{action: "accept"|"advance"|"deliver"|"cancel"}`. **Not** `{status:"DELIVERED"}` — that returns 400.
- Promotion validation: `POST /api/promotions/validate` with `{code, itemsSubtotal}` — discount base is items subtotal only, never courier fee.

## VM-specific browser tricks (important — these bit us this run)

### 1. Launch Chrome without the "Change your password" popup
Chrome will show a native password-leak popup after NextAuth login that blocks GUI clicks (Escape does not dismiss it). Relaunch with:

```bash
pkill -9 -f chrome 2>/dev/null; sleep 2
DISPLAY=:0 /opt/.devin/chrome/chrome/linux-137.0.7118.2/chrome-linux64/chrome \
  --no-first-run --no-default-browser-check \
  --remote-debugging-port=29229 --remote-allow-origins=* \
  --disable-features=PasswordLeakDetection,PasswordChangeInSettings,AutofillServerCommunication,PasswordCheckNotificationExperiment \
  --password-store=basic \
  --user-data-dir=/home/ubuntu/.browser_data_dir \
  http://localhost:3000/ >/tmp/chrome.log 2>&1 &
disown
```

Notes:
- `--remote-allow-origins=*` is required for Python `websocket-client` to connect (otherwise 403).
- `--user-data-dir=/home/ubuntu/.browser_data_dir` persists session cookies across restarts.

### 2. GUI clicks sometimes do not fire React `onClick`
On this VM, native-event clicks via `computer(action="act", [{"action":"left_click"...}])` sporadically did not dispatch the React handler (no state change), especially on small buttons or in RTL layouts. Reliable workaround: drive button clicks through CDP:

```python
import json, urllib.request, websocket

tabs = json.loads(urllib.request.urlopen("http://localhost:29229/json/list").read())
t = next(t for t in tabs if "localhost:3000" in t.get("url",""))
ws = websocket.create_connection(t["webSocketDebuggerUrl"])

def call(method, params=None, _id=[0]):
    _id[0] += 1
    ws.send(json.dumps({"id": _id[0], "method": method, "params": params or {}}))
    while True:
        m = json.loads(ws.recv())
        if m.get("id") == _id[0]:
            return m

js = """
(() => {
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'افزودن');
  btn && btn.click();
  return btn ? 'clicked' : 'not found';
})()
"""
print(call("Runtime.evaluate", {"expression": js, "returnByValue": True}))
```

`button.click()` fires the real React handler, so this is a valid E2E exercise, not a mock.

### 3. Programmatic NextAuth login from a side-process
For role switches without touching the browser, use a cookie jar + form-urlencoded POST:

```python
import json, urllib.request as ur, urllib.parse as up, http.cookiejar
jar = http.cookiejar.CookieJar()
opener = ur.build_opener(ur.HTTPCookieProcessor(jar))
csrf = json.loads(opener.open("http://localhost:3000/api/auth/csrf").read())["csrfToken"]
data = up.urlencode({"csrfToken":csrf,"email":"courier@market.local","password":"courier1234","callbackUrl":"/"}).encode()
opener.open(ur.Request("http://localhost:3000/api/auth/callback/credentials", data=data))
# opener now carries the session cookie — reuse it for POST /api/courier/location, /api/orders/<id>/status, etc.
```

### 4. Text typing is unreliable in fullscreen / password-popup states
If `computer("type")` doesn't populate an input, set the value via CDP using the native setter so React sees the change:

```js
(() => {
  const setVal = (el, v) => {
    const proto = el.tagName==='TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', {bubbles:true}));
  };
  setVal(document.querySelectorAll('input')[0], 'NOWRUZ20');
})()
```

Plain `el.value = v` alone does not trigger React.

## Recording tips
- Start screen recording only *after* the app is running and chrome is visible; re-launching chrome mid-test is fine and does not kill the recording.
- Use structured annotations (`setup` / `test_start` / `assertion`) — each assertion under 80 chars.
- `wmctrl` is not installed on this VM; skip window-maximize. F11 fullscreen works but can hide password popups until they block clicks — prefer the chrome flags above.

## Known quirks to watch for (may be broken in a future change; workaround may still apply)
- `/checkout` briefly renders its form to unauthenticated users before the client-side `useEffect` redirects. Server-side guards still prevent placing an order. If you see the form, wait ~1 s and re-check URL.
- `COURIER_NEXT_STATUS` map (`src/lib/roles.ts`) is what drives the 3-button labels. If buttons get stuck, check that map first.
- Discount is computed from **items subtotal only** — if a future regression applies it to items+courier, A4 would read something other than −136,000.
