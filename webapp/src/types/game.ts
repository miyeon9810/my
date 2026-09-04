import type { QuestDifficulty } from "@/lib/leveling";

export type LevelProgress = {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
};

export type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "legendary";
};

export type Me = {
  id: string;
  name: string | null;
  image: string | null;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  totalFocusSeconds: number;
  questsCompleted: number;
  progress: LevelProgress;
  badges: Badge[];
};

export type Quest = {
  id: string;
  title: string;
  description: string | null;
  difficulty: QuestDifficulty;
  xpReward: number;
  status: "active" | "done" | "archived";
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  partyId: string | null;
  clanId: string | null;
  party: { id: string; name: string } | null;
  clan: { id: string; name: string } | null;
};

export type PartyMember = {
  id: string;
  role: "owner" | "member";
  joinedAt: string;
  focusSeconds: number;
  user: { id: string; name: string | null; image: string | null };
};

export type Party = {
  id: string;
  name: string;
  goal: string | null;
  description: string | null;
  inviteCode: string;
  xp: number;
  level: number;
  createdById: string;
  createdAt: string;
  members: PartyMember[];
};

export type ClanMember = {
  id: string;
  role: "owner" | "member";
  joinedAt: string;
  focusSeconds: number;
  user: { id: string; name: string | null; image: string | null };
};

export type Clan = {
  id: string;
  name: string;
  goal: string | null;
  description: string | null;
  inviteCode: string;
  xp: number;
  level: number;
  createdById: string;
  createdAt: string;
  members: ClanMember[];
};

export type FocusSession = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  xpEarned: number;
  questId: string | null;
  partyId: string | null;
  clanId: string | null;
};
