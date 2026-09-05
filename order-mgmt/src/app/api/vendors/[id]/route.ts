import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, zodErrorResponse } from "@/lib/api-utils";
import { updateVendorSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateVendorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  const vendor = await prisma.vendor
    .update({
      where: { id },
      data: {
        name: data.name,
        isAdhoc: data.isAdhoc,
        orderDays: data.orderDays?.join(","),
        deliveryDays: data.deliveryDays?.join(","),
        sortOrder: data.sortOrder,
      },
    })
    .catch(() => null);
  if (!vendor) return jsonError("거래처를 찾을 수 없어", 404);

  return NextResponse.json({ vendor });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.vendor.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
