// Shared XP/level curve for users, parties and clans.
// Cumulative XP needed to *reach* a given level: base * (level - 1)^2
// so the gap between levels grows quadratically (level 2 is cheap, level 30 is a grind).

export type LevelProgress = {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
};

export function xpForLevel(level: number, base: number): number {
  if (level <= 1) return 0;
  return Math.round(base * (level - 1) ** 2);
}

export function levelFromXp(xp: number, base: number): number {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / base)) + 1;
}

export function getLevelProgress(xp: number, base: number): LevelProgress {
  const level = levelFromXp(xp, base);
  const floor = xpForLevel(level, base);
  const ceil = xpForLevel(level + 1, base);
  const span = ceil - floor;
  const xpIntoLevel = xp - floor;
  return {
    level,
    xp,
    xpIntoLevel,
    xpForNextLevel: span,
    progressPercent: span === 0 ? 100 : Math.min(100, Math.round((xpIntoLevel / span) * 100)),
  };
}

// Individual users level up fast so early wins feel good.
export const USER_XP_BASE = 50;
// Parties/clans pool XP from every member, so they need a much bigger base.
export const PARTY_XP_BASE = 120;
export const CLAN_XP_BASE = 400;

export const userLevelProgress = (xp: number) => getLevelProgress(xp, USER_XP_BASE);
export const partyLevelProgress = (xp: number) => getLevelProgress(xp, PARTY_XP_BASE);
export const clanLevelProgress = (xp: number) => getLevelProgress(xp, CLAN_XP_BASE);

export const QUEST_DIFFICULTIES = ["easy", "normal", "hard", "epic"] as const;
export type QuestDifficulty = (typeof QUEST_DIFFICULTIES)[number];

export const QUEST_XP_REWARD: Record<QuestDifficulty, number> = {
  easy: 10,
  normal: 20,
  hard: 35,
  epic: 60,
};

export const QUEST_DIFFICULTY_LABEL: Record<QuestDifficulty, string> = {
  easy: "쉬움",
  normal: "보통",
  hard: "어려움",
  epic: "에픽",
};

// Focus-timer sessions earn 1 xp per completed minute, rounded down.
export function xpForFocusSeconds(seconds: number): number {
  return Math.floor(seconds / 60);
}
