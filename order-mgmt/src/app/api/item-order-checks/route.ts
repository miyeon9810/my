import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { zodErrorResponse } from "@/lib/api-utils";
import { itemOrderCheckSchema } from "@/lib/validation";
import { todayDateKey } from "@/lib/weekday";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? todayDateKey();
  const checks = await prisma.itemOrderCheck.findMany({ where: { date } });
  return NextResponse.json({
    date,
    completed: Object.fromEntries(checks.map((c) => [c.itemId, c.completed])),
  });
}

export async function POST(request: NextRequest) {
  const parsed = itemOrderCheckSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { itemId, date, completed } = parsed.data;

  const check = await prisma.itemOrderCheck.upsert({
    where: { itemId_date: { itemId, date } },
    create: { itemId, date, completed, completedAt: completed ? new Date() : null },
    update: { completed, completedAt: completed ? new Date() : null },
  });

  return NextResponse.json({ check });
}
