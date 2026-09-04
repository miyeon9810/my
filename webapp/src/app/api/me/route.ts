import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";
import { userLevelProgress } from "@/lib/leveling";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      badges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
      _count: { select: { quests: { where: { status: "done" } } } },
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      image: user.image,
      xp: user.xp,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalFocusSeconds: user.totalFocusSeconds,
      questsCompleted: user._count.quests,
      progress: userLevelProgress(user.xp),
      badges: user.badges.map((b) => b.badge),
    },
  });
}
