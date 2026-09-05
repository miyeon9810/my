import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, zodErrorResponse } from "@/lib/api-utils";
import { createItemSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const parsed = createItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId } });
  if (!vendor) return jsonError("거래처를 찾을 수 없어", 404);

  const count = await prisma.item.count({ where: { vendorId: data.vendorId } });
  const item = await prisma.item.create({
    data: {
      vendorId: data.vendorId,
      name: data.name,
      safetyStock: data.safetyStock,
      currentStock: data.currentStock,
      stockUpdatedAt: new Date(),
      sortOrder: count,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
