import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding admin user only...");

  const adminPwd = await bcrypt.hash("admin1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@market.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@market.local",
      passwordHash: adminPwd,
      role: "ADMIN",
    },
  });

  console.log("Seed complete.");
  console.log("Admin: admin@market.local / admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
