import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { zodErrorResponse } from "@/lib/api-utils";
import { bulkStockSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const parsed = bulkStockSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const now = new Date();
  await prisma.$transaction(
    parsed.data.map((row) =>
      prisma.item.update({
        where: { id: row.id },
        data: { currentStock: row.currentStock, stockUpdatedAt: now },
      }),
    ),
  );

  return NextResponse.json({ ok: true, updatedAt: now });
}
