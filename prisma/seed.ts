import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  const hash = (p: string) => bcrypt.hash(p, 10);

  // Users
  const [adminPwd, customerPwd, courierPwd, restoPwd] = await Promise.all([
    hash("admin1234"),
    hash("customer1234"),
    hash("courier1234"),
    hash("restaurant1234"),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@market.local" },
    update: {},
    create: { name: "ادمین", email: "admin@market.local", passwordHash: adminPwd, role: "ADMIN" },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@market.local" },
    update: {},
    create: { name: "علی مشتری", email: "customer@market.local", passwordHash: customerPwd, role: "CUSTOMER" },
  });

  const courierUser = await prisma.user.upsert({
    where: { email: "courier@market.local" },
    update: {},
    create: { name: "رضا پیک", email: "courier@market.local", passwordHash: courierPwd, role: "COURIER" },
  });

  const restoOwner = await prisma.user.upsert({
    where: { email: "owner@market.local" },
    update: {},
    create: { name: "مهدی صاحب رستوران", email: "owner@market.local", passwordHash: restoPwd, role: "RESTAURANT" },
  });

  await prisma.courierProfile.upsert({
    where: { userId: courierUser.id },
    update: { isApproved: true, baseFee: 20000 },
    create: {
      userId: courierUser.id,
      isApproved: true,
      baseFee: 20000,
      lastLat: 35.6892,
      lastLng: 51.389,
    },
  });

  // Categories
  const cats = [
    { slug: "food", name: "غذا", kind: "FOOD" },
    { slug: "iranian", name: "ایرانی", kind: "FOOD" },
    { slug: "fastfood", name: "فست‌فود", kind: "FOOD" },
    { slug: "hygiene", name: "بهداشتی", kind: "HYGIENE" },
    { slug: "superstore", name: "سوپرمارکت", kind: "SUPERSTORE" },
    { slug: "dairy", name: "لبنیات", kind: "SUPERSTORE" },
  ];
  for (const c of cats) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, kind: c.kind },
      create: c,
    });
  }

  const iranian = await prisma.category.findUnique({ where: { slug: "iranian" } });
  const fastfood = await prisma.category.findUnique({ where: { slug: "fastfood" } });
  const hygiene = await prisma.category.findUnique({ where: { slug: "hygiene" } });
  const superstore = await prisma.category.findUnique({ where: { slug: "superstore" } });
  const dairy = await prisma.category.findUnique({ where: { slug: "dairy" } });

  // Restaurants
  const r1 = await prisma.restaurant.upsert({
    where: { slug: "shamshiri" },
    update: {},
    create: {
      ownerId: restoOwner.id,
      name: "رستوران شمشیری",
      slug: "shamshiri",
      description: "غذای سنتی ایرانی",
      address: "تهران، خیابان جمهوری",
      isApproved: true,
      rating: 4.6,
      lat: 35.6892,
      lng: 51.389,
    },
  });
  const r2 = await prisma.restaurant.upsert({
    where: { slug: "burger-house" },
    update: {},
    create: {
      ownerId: restoOwner.id,
      name: "برگرهاوس",
      slug: "burger-house",
      description: "بهترین برگرهای شهر",
      address: "تهران، ولیعصر",
      isApproved: true,
      rating: 4.4,
      lat: 35.7,
      lng: 51.4,
    },
  });

  if (iranian) {
    await prisma.restaurantCategory.upsert({
      where: { restaurantId_categoryId: { restaurantId: r1.id, categoryId: iranian.id } },
      update: {},
      create: { restaurantId: r1.id, categoryId: iranian.id },
    });
  }
  if (fastfood) {
    await prisma.restaurantCategory.upsert({
      where: { restaurantId_categoryId: { restaurantId: r2.id, categoryId: fastfood.id } },
      update: {},
      create: { restaurantId: r2.id, categoryId: fastfood.id },
    });
  }

  // Menu items
  const r1Menu = [
    { name: "چلوکباب کوبیده", price: 220000, description: "همراه با برنج ایرانی" },
    { name: "چلوجوجه کباب", price: 240000, description: "جوجه زعفرانی" },
    { name: "زرشک پلو با مرغ", price: 200000, description: "مرغ همراه با زرشک" },
  ];
  for (const m of r1Menu) {
    const existing = await prisma.menuItem.findFirst({ where: { restaurantId: r1.id, name: m.name } });
    if (!existing) await prisma.menuItem.create({ data: { ...m, restaurantId: r1.id } });
  }
  const r2Menu = [
    { name: "برگر کلاسیک", price: 180000, description: "گوشت ۱۵۰ گرمی" },
    { name: "چیزبرگر", price: 210000, description: "با پنیر چدار" },
    { name: "سیب‌زمینی سرخ‌کرده", price: 60000, description: "متوسط" },
  ];
  for (const m of r2Menu) {
    const existing = await prisma.menuItem.findFirst({ where: { restaurantId: r2.id, name: m.name } });
    if (!existing) await prisma.menuItem.create({ data: { ...m, restaurantId: r2.id } });
  }

  // Products (superstore + hygiene)
  const products = [
    { name: "شیر پرچرب ۱ لیتری", price: 25000, stock: 50, categoryId: dairy?.id },
    { name: "ماست سنتی ۹۰۰ گرمی", price: 38000, stock: 30, categoryId: dairy?.id },
    { name: "نان لواش", price: 12000, stock: 100, categoryId: superstore?.id },
    { name: "شامپو ۴۰۰ میلی", price: 95000, stock: 40, categoryId: hygiene?.id },
    { name: "خمیردندان", price: 45000, stock: 80, categoryId: hygiene?.id },
  ];
  for (const p of products) {
    if (!p.categoryId) continue;
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({
        data: { name: p.name, price: p.price, stock: p.stock, categoryId: p.categoryId },
      });
    }
  }

  // Ads
  const adsCount = await prisma.ad.count();
  if (adsCount === 0) {
    await prisma.ad.createMany({
      data: [
        {
          title: "تخفیف ویژه نوروز!",
          imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
          placement: "HOME",
        },
        {
          title: "ارسال رایگان روی سفارش بالای ۵۰۰ هزار",
          imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
          placement: "HOME",
        },
      ],
    });
  }

  // Festival + promotion
  const festival = await prisma.festival.upsert({
    where: { slug: "nowruz-1404" },
    update: {},
    create: {
      title: "جشنواره نوروز ۱۴۰۴",
      slug: "nowruz-1404",
      description: "تخفیف‌های ویژه برای ایام نوروز",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.promotion.upsert({
    where: { code: "NOWRUZ20" },
    update: {},
    create: {
      code: "NOWRUZ20",
      festivalId: festival.id,
      description: "۲۰٪ تخفیف نوروزی",
      percentOff: 20,
      minOrderTotal: 100000,
    },
  });
  await prisma.promotion.upsert({
    where: { code: "WELCOME50" },
    update: {},
    create: {
      code: "WELCOME50",
      description: "۵۰ هزار تومان تخفیف اولین سفارش",
      amountOff: 50000,
      minOrderTotal: 200000,
    },
  });

  console.log("Seed complete.");
  console.log("Admin: admin@market.local / admin1234");
  console.log("Customer: customer@market.local / customer1234");
  console.log("Courier: courier@market.local / courier1234");
  console.log("Restaurant Owner: owner@market.local / restaurant1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
