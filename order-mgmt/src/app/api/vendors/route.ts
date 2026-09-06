import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { zodErrorResponse } from "@/lib/api-utils";
import { createVendorSchema } from "@/lib/validation";

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json({ vendors });
}

export async function POST(request: NextRequest) {
  const parsed = createVendorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  const count = await prisma.vendor.count();
  const vendor = await prisma.vendor.create({
    data: {
      name: data.name,
      isAdhoc: data.isAdhoc,
      orderDays: data.orderDays.join(","),
      deliveryDays: data.deliveryDays.join(","),
      note: data.note,
      cardImage: data.cardImage,
      sortOrder: count,
    },
  });
  return NextResponse.json({ vendor }, { status: 201 });
}
