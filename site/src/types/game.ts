import type { QuestDifficulty } from "@/lib/leveling";

export type LevelProgress = {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
};

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  xp: number;
  level: number;
  totalFocusSeconds: number;
  currentStreak: number;
  longestStreak: number;
  lastQuestCompletedAt: Date | null;
  badgeCodes: string[];
  partyIds: string[];
  clanIds: string[];
  createdAt: Date | null;
};

export type Quest = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  difficulty: QuestDifficulty;
  xpReward: number;
  status: "active" | "done" | "archived";
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date | null;
  partyId: string | null;
  clanId: string | null;
};

export type GroupMember = {
  uid: string;
  role: "owner" | "member";
  joinedAt: Date | null;
  focusSeconds: number;
  name: string | null;
  image: string | null;
};

export type Group = {
  id: string;
  name: string;
  goal: string | null;
  description: string | null;
  xp: number;
  createdBy: string;
  createdAt: Date | null;
};

export type FocusSession = {
  id: string;
  userId: string;
  questId: string | null;
  partyId: string | null;
  clanId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number;
  xpEarned: number;
};
