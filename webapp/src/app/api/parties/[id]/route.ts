import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);
  const { id } = await params;

  const membership = await prisma.partyMember.findUnique({
    where: { partyId_userId: { partyId: id, userId } },
  });
  if (!membership) return jsonError("파티를 찾을 수 없어", 404);

  const party = await prisma.party.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
  });
  if (!party) return jsonError("파티를 찾을 수 없어", 404);

  return NextResponse.json({ party });
}
