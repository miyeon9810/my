import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, zodErrorResponse } from "@/lib/api-utils";
import { updateItemSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  const item = await prisma.item
    .update({
      where: { id },
      data: {
        name: data.name,
        safetyStock: data.safetyStock,
        currentStock: data.currentStock,
        stockUpdatedAt: data.currentStock !== undefined ? new Date() : undefined,
      },
    })
    .catch(() => null);
  if (!item) return jsonError("품목을 찾을 수 없어", 404);

  return NextResponse.json({ item });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.item.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
