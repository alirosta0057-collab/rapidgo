# مارکت سوپر — Super Market

پلتفرم سفارش آنلاین غذا، اقلام بهداشتی و سوپرمارکت با پنل مشتری، ادمین، رستوران و پیک موتوری. ساخته شده با Next.js 14 (App Router)، Prisma، NextAuth، Tailwind، Leaflet (OpenStreetMap) و Stripe.

## امکانات (MVP)

1. **دسته‌بندی‌های غذایی، بهداشتی و سوپرمارکت** — کتگوری‌های چندسطحه با تفکیک نوع.
2. **ثبت رستوران و مدیریت منو** — صاحبان رستوران منوی خود را وارد می‌کنند، ادمین تایید می‌کند.
3. **پیک موتوری و ارسال سفارش** — لیست سفارش‌های موجود، قبول توسط پیک، تحویل به مشتری.
4. **چهار سطح کاربری**: `CUSTOMER`، `ADMIN`، `COURIER`، `RESTAURANT`.
5. **GPS لحظه‌ای پیک** — Leaflet + OpenStreetMap. موقعیت پیک هر چند ثانیه از مرورگر فرستاده می‌شود؛ مشتری در صفحه سفارش، نقشهٔ پیک را به‌صورت زنده می‌بیند. **IP پیک** ثبت و در پنل ادمین نمایش داده می‌شود.
6. **سه وضعیت سفارش که پیک خودش انتخاب می‌کند**: `قبول سفارش (ACCEPTED)` → `تهیه سفارش (PREPARING)` → `پیک در راه (ON_THE_WAY)` → `تحویل شد (DELIVERED)`.
7. **کمیسیون سایت و حق سرویس پیک** — قابل پیکربندی از طریق متغیرهای محیطی، در هر سفارش جداگانه ذخیره می‌شود، گزارش جداگانه در پنل ادمین.
8. **بخش تبلیغات** — ادمین بنرهای صفحه اصلی/دسته‌بندی/رستوران را مدیریت می‌کند.
9. **بخش جشنواره‌ها** — جشنواره‌ها به همراه کدهای تخفیف (درصدی یا مبلغی)، با حداقل سفارش و سقف استفاده.

## پیش‌نیاز

- Node.js 20+
- pnpm (یا npm/yarn)

## راه‌اندازی

```bash
pnpm install
cp .env.example .env       # سپس مقادیر را تنظیم کنید
pnpm prisma db push        # ساخت دیتابیس SQLite (یا Postgres در صورت تغییر provider)
pnpm db:seed               # داده‌ی نمونه + کاربران تست
pnpm dev                   # http://localhost:3000
```

### کاربران تست (پس از seed)

| نقش | ایمیل | رمز عبور |
| --- | --- | --- |
| ادمین | `admin@market.local` | `admin1234` |
| مشتری | `customer@market.local` | `customer1234` |
| پیک | `courier@market.local` | `courier1234` |
| صاحب رستوران | `owner@market.local` | `restaurant1234` |

## متغیرهای محیطی مهم

- `DATABASE_URL` — برای SQLite: `file:./dev.db`؛ برای Postgres: connection string کامل (و تغییر `provider` در `prisma/schema.prisma`).
- `NEXTAUTH_SECRET` — یک رشته‌ی تصادفی طولانی.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — اختیاری؛ بدون اینها پرداخت به‌صورت شبیه‌سازی شده انجام می‌شود.
- `COMMISSION_RATE` — کمیسیون سایت (مثلاً `0.10` = ۱۰٪).
- `COURIER_SERVICE_FEE` — حق سرویس پایهٔ پیک.

## مسیرهای کلیدی

- `/` — صفحه اصلی، تبلیغات، دسته‌بندی، رستوران‌های پربازدید
- `/category/[slug]` — صفحه دسته
- `/restaurants` — لیست رستوران‌ها
- `/restaurants/[slug]` — صفحه رستوران و منو
- `/cart` — سبد خرید
- `/checkout` — پرداخت (Stripe یا شبیه‌سازی شده)
- `/orders` — سفارش‌های مشتری
- `/orders/[id]` — جزییات سفارش با ردیابی نقشهٔ پیک
- `/festivals` — لیست جشنواره‌ها
- `/festivals/[slug]` — کدهای تخفیف یک جشنواره
- `/restaurant` — پنل صاحب رستوران
- `/restaurant/setup` — ثبت رستوران جدید
- `/restaurant/[id]` — مدیریت منو و سفارش‌های یک رستوران
- `/courier` — پنل پیک با ردیابی GPS، سفارش‌های موجود، انتقال وضعیت
- `/admin` — داشبورد ادمین
- `/admin/categories` — مدیریت دسته‌ها
- `/admin/restaurants` — تایید رستوران‌ها
- `/admin/products` — مدیریت محصولات سوپرمارکت/بهداشتی
- `/admin/orders` — مشاهده همه سفارش‌ها
- `/admin/couriers` — تایید پیک‌ها، مشاهده موقعیت و IP
- `/admin/commissions` — گزارش کمیسیون و حق پیک
- `/admin/ads` — مدیریت تبلیغات
- `/admin/festivals` — مدیریت جشنواره‌ها و کدهای تخفیف

## API های اصلی

- `POST /api/auth/register` — ثبت‌نام با نقش
- `POST /api/orders` — ثبت سفارش، شامل ساخت Stripe Checkout Session در صورت فعال بودن
- `POST /api/orders/[id]/status` — `accept|advance|deliver|cancel` (پیک سه وضعیت بعدی را خودش پیش می‌برد)
- `POST /api/courier/location` — دریافت لحظه‌ای موقعیت پیک (lat,lng) + ثبت IP
- `GET /api/courier/location?orderId=...` — مشاهده موقعیت پیکِ منتسب به سفارش
- `GET /api/promotions/validate?code=...&total=...` — اعتبارسنجی کد تخفیف
- `POST /api/webhooks/stripe` — دریافت رویداد `checkout.session.completed`

## مدل کسب‌وکار / محاسبات سفارش

```
itemsTotal      = Σ(price × quantity)
commissionFee   = round(itemsTotal × commissionRate)        # درآمد سایت
courierFee      = COURIER_SERVICE_FEE                       # درآمد پیک
discountAmount  = از کد تخفیف (درصدی یا مبلغی)
total           = max(0, itemsTotal + courierFee − discountAmount)
```

`commissionFee` از سهم رستوران کم می‌شود و در پنل ادمین گزارش داده می‌شود. `courierFee` در ستون مجزا برای تسویه با پیک نگهداری می‌شود.

## نکات تولید/Production

- برای استفاده از Postgres، `provider` در `prisma/schema.prisma` را به `postgresql` تغییر داده و migration اجرا کنید (`pnpm prisma migrate dev`).
- `NEXTAUTH_SECRET` را حتماً به یک مقدار قوی تغییر دهید.
- برای Stripe در محیط واقعی، `STRIPE_WEBHOOK_SECRET` را تنظیم و وب‌هوک را روی `/api/webhooks/stripe` نشانه بگیرید.
- ردیابی پیک از Geolocation API مرورگر استفاده می‌کند؛ روی HTTPS لازم است.
