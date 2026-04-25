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

## راه‌اندازی محلی

برای local dev نیاز به یک Postgres دارید (Docker یا Neon رایگان):

```bash
# گزینه ۱: Postgres با Docker
docker run -d --name market-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# گزینه ۲: یک پروژه رایگان روی Neon بسازید و connection string بگیرید
```

سپس:

```bash
pnpm install
cp .env.example .env        # DATABASE_URL را با مقدار خودتان جایگزین کنید
pnpm prisma db push         # ساخت اسکیما
pnpm db:seed                # داده‌ی نمونه + کاربران تست
pnpm dev                    # http://localhost:3000
```

### کاربران تست (پس از seed)

| نقش | ایمیل | رمز عبور |
| --- | --- | --- |
| ادمین | `admin@market.local` | `admin1234` |
| مشتری | `customer@market.local` | `customer1234` |
| پیک | `courier@market.local` | `courier1234` |
| صاحب رستوران | `owner@market.local` | `restaurant1234` |

## متغیرهای محیطی مهم

- `DATABASE_URL` — connection string کامل PostgreSQL (مثلاً Neon یا Supabase).
- `NEXTAUTH_URL` — آدرس کامل سایت در production (مثلاً `https://rapidgo.vercel.app`).
- `NEXTAUTH_SECRET` — یک رشته‌ی تصادفی طولانی (با `openssl rand -base64 32` تولید کنید).
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — اختیاری؛ بدون اینها پرداخت به‌صورت شبیه‌سازی شده انجام می‌شود.
- `COMMISSION_RATE` — کمیسیون سایت (مثلاً `0.10` = ۱۰٪).
- `COURIER_SERVICE_FEE` — حق سرویس پایهٔ پیک.

## Deploy on Vercel

### 1) ساخت دیتابیس Postgres (رایگان)

یکی از این گزینه‌ها را انتخاب کنید:

- **Neon (پیشنهاد)**: https://console.neon.tech — Sign up → Create project → کپی `DATABASE_URL` (با `?sslmode=require`).
- **Supabase**: https://supabase.com — Project → Settings → Database → URI.
- **Vercel Postgres**: داخل dashboard پروژه Vercel → Storage → Create.

### 2) Import پروژه روی Vercel

1. https://vercel.com/new → Login with GitHub → ریپو `rapidgo` را Import کنید.
2. در صفحه **Configure**، Environment Variables زیر را اضافه کنید:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | connection string از مرحله ۱ |
   | `NEXTAUTH_URL` | آدرس Vercel که بعد از deploy ساخته می‌شود (می‌توانید بعد از اولین deploy ست کنید و یک‌بار redeploy بزنید) |
   | `NEXTAUTH_SECRET` | خروجی `openssl rand -base64 32` |
   | `NEXT_PUBLIC_SITE_NAME` | `مارکت سوپر` |
   | `COMMISSION_RATE` | `0.10` |
   | `COURIER_SERVICE_FEE` | `20000` |

3. Build command و Install command را پیش‌فرض بگذارید (Vercel به‌طور خودکار `pnpm install` و `pnpm build` را اجرا می‌کند). `prisma generate` در `postinstall` اجرا می‌شود.
4. Deploy.

### 3) ساخت اسکیمای دیتابیس و seed داده‌های اولیه

از روی سیستم خودتان یا یک‌بار از داخل Vercel CLI:

```bash
export DATABASE_URL="<همون connection string بالا>"
pnpm prisma db push     # ساخت جدول‌ها
pnpm db:seed            # کاربران تست + رستوران + کد تخفیف NOWRUZ20
```

پس از این مرحله، اپ روی دامنهٔ Vercel کاملاً قابل استفاده است. برای custom domain از داشبورد Vercel → Domains اقدام کنید.

> **توجه**: ردیابی موقعیت پیک از Geolocation API مرورگر استفاده می‌کند که فقط روی HTTPS کار می‌کند — Vercel به‌طور پیش‌فرض HTTPS فراهم می‌کند.

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

- `NEXTAUTH_SECRET` را حتماً به یک مقدار قوی تغییر دهید (`openssl rand -base64 32`).
- برای Stripe واقعی، `STRIPE_SECRET_KEY` و `STRIPE_WEBHOOK_SECRET` را تنظیم و وب‌هوک را روی `/api/webhooks/stripe` نشانه بگیرید.
- ردیابی پیک از Geolocation API مرورگر استفاده می‌کند؛ روی HTTPS لازم است (Vercel به‌طور پیش‌فرض فراهم می‌کند).
- برای migration در آینده از `pnpm prisma migrate dev` در local استفاده کنید و migration ها را commit کنید؛ روی Vercel به‌طور خودکار `prisma migrate deploy` اجرا می‌شود (یا یک‌بار `prisma db push` کافی است).
