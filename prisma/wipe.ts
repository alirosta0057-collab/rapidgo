/**
 * Wipes ALL application data from the database, then creates a single
 * admin user (admin@market.local / admin1234).
 *
 * Usage:
 *   DATABASE_URL=... pnpm db:wipe
 *
 * This is intentionally destructive — it deletes every row from every
 * application table. It is meant for cleaning out demo data before going
 * live. Do NOT run against a database that contains real user data unless
 * you mean to.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Wiping all application data...");

  // Order matters: delete children before parents to respect FK constraints.
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  await prisma.menuItem.deleteMany();
  await prisma.restaurantCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.category.deleteMany();

  await prisma.promotion.deleteMany();
  await prisma.festival.deleteMany();
  await prisma.ad.deleteMany();

  await prisma.courierLocation.deleteMany();
  await prisma.courierProfile.deleteMany();

  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log("Wipe complete. Creating admin user...");

  const adminPwd = await bcrypt.hash("admin1234", 10);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@market.local",
      passwordHash: adminPwd,
      role: "ADMIN",
    },
  });

  console.log("Done.");
  console.log("Admin: admin@market.local / admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
