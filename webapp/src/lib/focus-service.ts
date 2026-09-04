import { prisma } from "@/lib/prisma";
import {
  clanLevelProgress,
  partyLevelProgress,
  userLevelProgress,
  xpForFocusSeconds,
} from "@/lib/leveling";
import { syncAchievements } from "@/lib/achievements";

export class FocusServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function startFocusSession(
  userId: string,
  input: { questId?: string | null; partyId?: string | null; clanId?: string | null },
) {
  const active = await prisma.focusSession.findFirst({ where: { userId, endedAt: null } });
  if (active) throw new FocusServiceError("이미 진행 중인 타이머가 있어. 먼저 종료해줘.", 409);

  if (input.partyId) {
    const membership = await prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId: input.partyId, userId } },
    });
    if (!membership) throw new FocusServiceError("해당 파티 멤버가 아니야", 403);
  }
  if (input.clanId) {
    const membership = await prisma.clanMember.findUnique({
      where: { clanId_userId: { clanId: input.clanId, userId } },
    });
    if (!membership) throw new FocusServiceError("해당 클랜 멤버가 아니야", 403);
  }
  if (input.questId) {
    const quest = await prisma.quest.findUnique({ where: { id: input.questId } });
    if (!quest || quest.userId !== userId) throw new FocusServiceError("퀘스트를 찾을 수 없어", 404);
  }

  return prisma.focusSession.create({
    data: {
      userId,
      questId: input.questId ?? undefined,
      partyId: input.partyId ?? undefined,
      clanId: input.clanId ?? undefined,
    },
  });
}

export async function stopFocusSession(userId: string, sessionId: string) {
  const session = await prisma.focusSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) throw new FocusServiceError("타이머를 찾을 수 없어", 404);
  if (session.endedAt) throw new FocusServiceError("이미 종료된 타이머야", 409);

  const now = new Date();
  const durationSeconds = Math.max(0, Math.round((now.getTime() - session.startedAt.getTime()) / 1000));
  const xpEarned = xpForFocusSeconds(durationSeconds);

  const updated = await prisma.focusSession.update({
    where: { id: sessionId },
    data: { endedAt: now, durationSeconds, xpEarned },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const nextXp = user.xp + xpEarned;
  const beforeLevel = userLevelProgress(user.xp).level;
  const afterLevel = userLevelProgress(nextXp).level;
  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: nextXp,
      level: afterLevel,
      totalFocusSeconds: user.totalFocusSeconds + durationSeconds,
    },
  });

  if (session.partyId) {
    await prisma.partyMember.update({
      where: { partyId_userId: { partyId: session.partyId, userId } },
      data: { focusSeconds: { increment: durationSeconds } },
    });
    const party = await prisma.party.update({
      where: { id: session.partyId },
      data: { xp: { increment: xpEarned } },
    });
    await prisma.party.update({
      where: { id: session.partyId },
      data: { level: partyLevelProgress(party.xp).level },
    });
  }
  if (session.clanId) {
    await prisma.clanMember.update({
      where: { clanId_userId: { clanId: session.clanId, userId } },
      data: { focusSeconds: { increment: durationSeconds } },
    });
    const clan = await prisma.clan.update({
      where: { id: session.clanId },
      data: { xp: { increment: xpEarned } },
    });
    await prisma.clan.update({
      where: { id: session.clanId },
      data: { level: clanLevelProgress(clan.xp).level },
    });
  }

  const newBadges = await syncAchievements(userId);

  return {
    session: updated,
    xpGained: xpEarned,
    leveledUp: afterLevel > beforeLevel,
    newLevel: afterLevel,
    newBadges,
  };
}
