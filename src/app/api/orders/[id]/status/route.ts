import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COURIER_NEXT_STATUS, ORDER_STATUS } from "@/lib/roles";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["accept", "advance", "deliver", "cancel"]),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { action } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  const role = session.user.role;
  let nextStatus: string | null = null;
  const updates: Record<string, unknown> = {};

  if (action === "accept") {
    // courier accepts an unassigned PAID order
    if (role !== "COURIER" && role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (order.courierId && order.courierId !== session.user.id) {
      return NextResponse.json({ error: "already_taken" }, { status: 409 });
    }
    if (order.status !== ORDER_STATUS.PAID && order.status !== ORDER_STATUS.ACCEPTED) {
      return NextResponse.json({ error: "not_acceptable" }, { status: 400 });
    }
    nextStatus = ORDER_STATUS.ACCEPTED;
    updates.courierId = session.user.id;
    updates.acceptedAt = new Date();
  } else if (action === "advance") {
    if (role !== "COURIER" && role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (order.courierId !== session.user.id && role !== "ADMIN")
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    nextStatus = COURIER_NEXT_STATUS[order.status] ?? null;
    if (!nextStatus) return NextResponse.json({ error: "cannot_advance" }, { status: 400 });
    if (nextStatus === ORDER_STATUS.PREPARING) updates.preparingAt = new Date();
    if (nextStatus === ORDER_STATUS.ON_THE_WAY) updates.onTheWayAt = new Date();
    if (nextStatus === ORDER_STATUS.DELIVERED) updates.deliveredAt = new Date();
  } else if (action === "deliver") {
    if (role !== "COURIER" && role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    nextStatus = ORDER_STATUS.DELIVERED;
    updates.deliveredAt = new Date();
  } else if (action === "cancel") {
    if (role !== "ADMIN" && session.user.id !== order.customerId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (order.status === ORDER_STATUS.DELIVERED) return NextResponse.json({ error: "already_delivered" }, { status: 400 });
    nextStatus = ORDER_STATUS.CANCELLED;
  }

  if (!nextStatus) return NextResponse.json({ error: "no_change" }, { status: 400 });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      ...updates,
      status: nextStatus,
      events: { create: { status: nextStatus, note: `via ${action} by ${role}` } },
    },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
