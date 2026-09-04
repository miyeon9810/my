import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { generateInviteCode } from "@/lib/invite-code";
import { syncAchievements } from "@/lib/achievements";

export class ClanServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function createClan(userId: string, input: { name: string; goal?: string; description?: string }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const clan = await prisma.clan.create({
        data: {
          name: input.name,
          goal: input.goal,
          description: input.description,
          inviteCode: generateInviteCode(),
          createdById: userId,
          members: { create: { userId, role: "owner" } },
        },
      });
      await syncAchievements(userId);
      return clan;
    } catch (err) {
      if (isUniqueConstraintError(err)) continue;
      throw err;
    }
  }
  throw new ClanServiceError("초대 코드 생성에 실패했어. 다시 시도해줘.", 500);
}

export async function joinClanByCode(userId: string, inviteCode: string) {
  const clan = await prisma.clan.findUnique({ where: { inviteCode } });
  if (!clan) throw new ClanServiceError("초대 코드를 찾을 수 없어", 404);

  const existing = await prisma.clanMember.findUnique({
    where: { clanId_userId: { clanId: clan.id, userId } },
  });
  if (existing) throw new ClanServiceError("이미 가입한 클랜이야", 409);

  await prisma.clanMember.create({ data: { clanId: clan.id, userId } });
  await syncAchievements(userId);
  return clan;
}

export async function leaveClan(userId: string, clanId: string) {
  const membership = await prisma.clanMember.findUnique({
    where: { clanId_userId: { clanId, userId } },
  });
  if (!membership) throw new ClanServiceError("가입한 클랜이 아니야", 404);

  if (membership.role === "owner") {
    const otherCount = await prisma.clanMember.count({ where: { clanId, userId: { not: userId } } });
    if (otherCount > 0) {
      throw new ClanServiceError("클랜장은 다른 멤버가 남아있으면 탈퇴할 수 없어. 클랜을 삭제하거나 멤버를 내보내줘.", 400);
    }
  }

  await prisma.clanMember.delete({ where: { clanId_userId: { clanId, userId } } });
}
