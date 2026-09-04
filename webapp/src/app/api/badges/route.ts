import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const badges = await prisma.badge.findMany({ orderBy: { tier: "asc" } });
  return NextResponse.json({ badges });
}
