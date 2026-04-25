import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(["CUSTOMER", "COURIER", "RESTAURANT"]).default("CUSTOMER"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "اطلاعات ورودی نامعتبر است." }, { status: 400 });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      phone: data.phone || null,
      passwordHash,
      role: data.role,
    },
  });

  if (data.role === "COURIER") {
    await prisma.courierProfile.create({
      data: { userId: user.id, baseFee: Number(process.env.COURIER_SERVICE_FEE || 20000) },
    });
  }

  return NextResponse.json({ id: user.id }, { status: 201 });
}
