import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { jsonError, zodErrorResponse } from "@/lib/api-utils";
import { createQuestSchema } from "@/lib/validation";
import { QUEST_XP_REWARD, QuestDifficulty } from "@/lib/leveling";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const scope = request.nextUrl.searchParams.get("scope") ?? "active";
  const partyId = request.nextUrl.searchParams.get("partyId");
  const clanId = request.nextUrl.searchParams.get("clanId");

  const quests = await prisma.quest.findMany({
    where: {
      userId,
      ...(scope !== "all" ? { status: scope } : {}),
      ...(partyId ? { partyId } : {}),
      ...(clanId ? { clanId } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      party: { select: { id: true, name: true } },
      clan: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ quests });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const parsed = createQuestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (data.partyId) {
    const membership = await prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId: data.partyId, userId } },
    });
    if (!membership) return jsonError("해당 파티 멤버가 아니야", 403);
  }
  if (data.clanId) {
    const membership = await prisma.clanMember.findUnique({
      where: { clanId_userId: { clanId: data.clanId, userId } },
    });
    if (!membership) return jsonError("해당 클랜 멤버가 아니야", 403);
  }

  const difficulty = data.difficulty as QuestDifficulty;
  const quest = await prisma.quest.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      difficulty,
      xpReward: QUEST_XP_REWARD[difficulty],
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      partyId: data.partyId ?? undefined,
      clanId: data.clanId ?? undefined,
    },
  });

  return NextResponse.json({ quest }, { status: 201 });
}
