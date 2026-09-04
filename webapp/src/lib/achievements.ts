import { prisma } from "@/lib/prisma";
import { userLevelProgress } from "@/lib/leveling";

export { BADGE_CATALOG, BADGE_TIER_LABEL, type BadgeTier, type BadgeDefinition } from "@/lib/badges";

async function evaluateUnlockedCodes(userId: string): Promise<string[]> {
  const [user, doneQuestCount, epicDone, partyMemberCount, partyOwnedCount, clanMemberCount, clanOwnedCount] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.quest.count({ where: { userId, status: "done" } }),
      prisma.quest.count({ where: { userId, status: "done", difficulty: "epic" } }),
      prisma.partyMember.count({ where: { userId } }),
      prisma.party.count({ where: { createdById: userId } }),
      prisma.clanMember.count({ where: { userId } }),
      prisma.clan.count({ where: { createdById: userId } }),
    ]);

  const level = userLevelProgress(user.xp).level;
  const codes: string[] = [];

  if (doneQuestCount >= 1) codes.push("first_quest");
  if (doneQuestCount >= 10) codes.push("quest_10");
  if (doneQuestCount >= 50) codes.push("quest_50");
  if (doneQuestCount >= 100) codes.push("quest_100");
  if (epicDone >= 1) codes.push("epic_quest");

  if (user.currentStreak >= 3) codes.push("streak_3");
  if (user.currentStreak >= 7) codes.push("streak_7");
  if (user.currentStreak >= 30) codes.push("streak_30");

  if (user.totalFocusSeconds >= 3600) codes.push("focus_1h");
  if (user.totalFocusSeconds >= 36000) codes.push("focus_10h");
  if (user.totalFocusSeconds >= 360000) codes.push("focus_100h");

  if (level >= 5) codes.push("level_5");
  if (level >= 10) codes.push("level_10");
  if (level >= 25) codes.push("level_25");

  if (partyMemberCount >= 1) codes.push("party_join");
  if (partyOwnedCount >= 1) codes.push("party_create");
  if (clanMemberCount >= 1) codes.push("clan_join");
  if (clanOwnedCount >= 1) codes.push("clan_create");

  return codes;
}

// Re-evaluates every unlock rule for a user and grants any badges they now
// qualify for but don't already have. Returns the newly-earned badges.
export async function syncAchievements(userId: string) {
  const [unlockedCodes, existing, badges] = await Promise.all([
    evaluateUnlockedCodes(userId),
    prisma.userBadge.findMany({ where: { userId }, select: { badge: { select: { code: true } } } }),
    prisma.badge.findMany(),
  ]);

  const alreadyHave = new Set(existing.map((e) => e.badge.code));
  const badgeByCode = new Map(badges.map((b) => [b.code, b]));

  const newlyEarned = unlockedCodes.filter((code) => !alreadyHave.has(code) && badgeByCode.has(code));
  if (newlyEarned.length === 0) return [];

  await prisma.userBadge.createMany({
    data: newlyEarned.map((code) => ({ userId, badgeId: badgeByCode.get(code)!.id })),
  });

  return newlyEarned.map((code) => badgeByCode.get(code)!);
}
