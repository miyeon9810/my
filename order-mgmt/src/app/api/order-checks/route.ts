import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { zodErrorResponse } from "@/lib/api-utils";
import { orderCheckSchema } from "@/lib/validation";
import { todayDateKey } from "@/lib/weekday";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? todayDateKey();
  const checks = await prisma.orderCheck.findMany({ where: { date } });
  return NextResponse.json({
    date,
    completed: Object.fromEntries(checks.map((c) => [c.vendorId, c.completed])),
  });
}

export async function POST(request: NextRequest) {
  const parsed = orderCheckSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { vendorId, date, completed } = parsed.data;

  const check = await prisma.orderCheck.upsert({
    where: { vendorId_date: { vendorId, date } },
    create: { vendorId, date, completed, completedAt: completed ? new Date() : null },
    update: { completed, completedAt: completed ? new Date() : null },
  });

  return NextResponse.json({ check });
}
