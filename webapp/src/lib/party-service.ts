import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { generateInviteCode } from "@/lib/invite-code";
import { syncAchievements } from "@/lib/achievements";

export class PartyServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function createParty(userId: string, input: { name: string; goal?: string; description?: string }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const party = await prisma.party.create({
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
      return party;
    } catch (err) {
      if (isUniqueConstraintError(err)) continue;
      throw err;
    }
  }
  throw new PartyServiceError("초대 코드 생성에 실패했어. 다시 시도해줘.", 500);
}

export async function joinPartyByCode(userId: string, inviteCode: string) {
  const party = await prisma.party.findUnique({ where: { inviteCode } });
  if (!party) throw new PartyServiceError("초대 코드를 찾을 수 없어", 404);

  const existing = await prisma.partyMember.findUnique({
    where: { partyId_userId: { partyId: party.id, userId } },
  });
  if (existing) throw new PartyServiceError("이미 가입한 파티야", 409);

  await prisma.partyMember.create({ data: { partyId: party.id, userId } });
  await syncAchievements(userId);
  return party;
}

export async function leaveParty(userId: string, partyId: string) {
  const membership = await prisma.partyMember.findUnique({
    where: { partyId_userId: { partyId, userId } },
  });
  if (!membership) throw new PartyServiceError("가입한 파티가 아니야", 404);

  if (membership.role === "owner") {
    const otherCount = await prisma.partyMember.count({ where: { partyId, userId: { not: userId } } });
    if (otherCount > 0) {
      throw new PartyServiceError("파티장은 다른 멤버가 남아있으면 탈퇴할 수 없어. 파티를 삭제하거나 멤버를 내보내줘.", 400);
    }
  }

  await prisma.partyMember.delete({ where: { partyId_userId: { partyId, userId } } });
}
