import { prisma } from "@/lib/prisma";
import {
  QUEST_XP_REWARD,
  QuestDifficulty,
  clanLevelProgress,
  partyLevelProgress,
  userLevelProgress,
} from "@/lib/leveling";
import { syncAchievements } from "@/lib/achievements";

function isSameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isConsecutiveDay(previous: Date, now: Date) {
  const prevMidnight = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowMidnight.getTime() - prevMidnight.getTime()) / 86_400_000);
  return diffDays === 1;
}

export class QuestServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Completes a quest owned by `userId`: awards XP to the user (and to the
// quest's party/clan if it belongs to one), updates the daily streak, keeps
// denormalized level fields in sync, and unlocks any newly-earned badges.
export async function completeQuest(questId: string, userId: string) {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.userId !== userId) {
    throw new QuestServiceError("퀘스트를 찾을 수 없어", 404);
  }
  if (quest.status === "done") {
    throw new QuestServiceError("이미 완료한 퀘스트야", 409);
  }

  const now = new Date();
  const xpGained = QUEST_XP_REWARD[quest.difficulty as QuestDifficulty] ?? quest.xpReward;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const beforeLevel = userLevelProgress(user.xp).level;

  let nextStreak = 1;
  if (user.lastQuestCompletedAt) {
    if (isSameCalendarDay(user.lastQuestCompletedAt, now)) {
      nextStreak = user.currentStreak || 1;
    } else if (isConsecutiveDay(user.lastQuestCompletedAt, now)) {
      nextStreak = user.currentStreak + 1;
    }
  }
  const nextXp = user.xp + xpGained;
  const afterLevel = userLevelProgress(nextXp).level;

  const [updatedQuest] = await prisma.$transaction([
    prisma.quest.update({
      where: { id: questId },
      data: { status: "done", completedAt: now },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        xp: nextXp,
        level: afterLevel,
        currentStreak: nextStreak,
        longestStreak: Math.max(user.longestStreak, nextStreak),
        lastQuestCompletedAt: now,
      },
    }),
  ]);

  if (quest.partyId) {
    const party = await prisma.party.update({
      where: { id: quest.partyId },
      data: { xp: { increment: xpGained } },
    });
    await prisma.party.update({
      where: { id: quest.partyId },
      data: { level: partyLevelProgress(party.xp).level },
    });
  }
  if (quest.clanId) {
    const clan = await prisma.clan.update({
      where: { id: quest.clanId },
      data: { xp: { increment: xpGained } },
    });
    await prisma.clan.update({
      where: { id: quest.clanId },
      data: { level: clanLevelProgress(clan.xp).level },
    });
  }

  const newBadges = await syncAchievements(userId);

  return {
    quest: updatedQuest,
    xpGained,
    leveledUp: afterLevel > beforeLevel,
    newLevel: afterLevel,
    newBadges,
  };
}
