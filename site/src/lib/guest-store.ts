// Zero-backend "guest mode": everything lives in this browser's localStorage.
// Lets the app be fully playable (quests, XP/levels, badges, solo focus
// timer) with no Firebase project at all. Party/clan need a real shared
// backend, so guests don't get those — see GuestBlocked.tsx.

import {
  QUEST_XP_REWARD,
  userLevelProgress,
  xpForFocusSeconds,
  type QuestDifficulty,
} from "@/lib/leveling";
import { BADGE_CATALOG } from "@/lib/badges";
import type { FocusSession, Quest, UserProfile } from "@/types/game";

const GUEST_ID_KEY = "questlog:guestId";
const GUEST_DATA_KEY = "questlog:guestData";

type StoredQuest = {
  id: string;
  title: string;
  description: string | null;
  difficulty: QuestDifficulty;
  xpReward: number;
  status: "active" | "done" | "archived";
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
};

type StoredFocusSession = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  xpEarned: number;
};

type GuestData = {
  name: string | null;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastQuestCompletedAt: string | null;
  totalFocusSeconds: number;
  badgeCodes: string[];
  quests: StoredQuest[];
  focusSessions: StoredFocusSession[];
};

export class GuestServiceError extends Error {}

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function isGuestUid(uid: string | null | undefined): boolean {
  return Boolean(uid && uid.startsWith("guest:"));
}

export function isGuestQuestId(id: string): boolean {
  return id.startsWith("gq_");
}

export function isGuestSessionId(id: string): boolean {
  return id.startsWith("gf_");
}

export function getOrCreateGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = `guest:${randomId("g")}`;
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function hasGuestId(): boolean {
  return Boolean(localStorage.getItem(GUEST_ID_KEY));
}

// Pure read for use during render (no localStorage write). Only meaningful
// once a guest id is known to already exist (see hasGuestId/enterGuestMode).
export function peekGuestId(): string | null {
  return localStorage.getItem(GUEST_ID_KEY);
}

function defaultData(): GuestData {
  return {
    name: "게스트 모험가",
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastQuestCompletedAt: null,
    totalFocusSeconds: 0,
    badgeCodes: [],
    quests: [],
    focusSessions: [],
  };
}

function load(): GuestData {
  try {
    const raw = localStorage.getItem(GUEST_DATA_KEY);
    if (!raw) return defaultData();
    return { ...defaultData(), ...JSON.parse(raw) };
  } catch {
    return defaultData();
  }
}

const listeners = new Set<() => void>();

function save(data: GuestData) {
  localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function mapProfile(guestId: string, data: GuestData): UserProfile {
  return {
    id: guestId,
    name: data.name,
    email: null,
    image: null,
    xp: data.xp,
    level: userLevelProgress(data.xp).level,
    totalFocusSeconds: data.totalFocusSeconds,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak,
    lastQuestCompletedAt: data.lastQuestCompletedAt ? new Date(data.lastQuestCompletedAt) : null,
    badgeCodes: data.badgeCodes,
    partyIds: [],
    clanIds: [],
    createdAt: null,
  };
}

function mapQuest(q: StoredQuest): Quest {
  return {
    id: q.id,
    userId: getOrCreateGuestId(),
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
    xpReward: q.xpReward,
    status: q.status,
    dueDate: q.dueDate ? new Date(q.dueDate) : null,
    completedAt: q.completedAt ? new Date(q.completedAt) : null,
    createdAt: new Date(q.createdAt),
    partyId: null,
    clanId: null,
  };
}

function mapSession(s: StoredFocusSession): FocusSession {
  return {
    id: s.id,
    userId: getOrCreateGuestId(),
    questId: null,
    partyId: null,
    clanId: null,
    startedAt: new Date(s.startedAt),
    endedAt: s.endedAt ? new Date(s.endedAt) : null,
    durationSeconds: s.durationSeconds,
    xpEarned: s.xpEarned,
  };
}

export function guestSubscribeProfile(onChange: (profile: UserProfile) => void) {
  const guestId = getOrCreateGuestId();
  const emit = () => onChange(mapProfile(guestId, load()));
  emit();
  return subscribe(emit);
}

export function guestListenUserQuests(onChange: (quests: Quest[]) => void) {
  const emit = () => {
    const quests = load().quests.map(mapQuest);
    quests.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    onChange(quests);
  };
  emit();
  return subscribe(emit);
}

export function guestCreateQuest(input: {
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  dueDate?: string;
}) {
  const data = load();
  data.quests.push({
    id: randomId("gq"),
    title: input.title,
    description: input.description ?? null,
    difficulty: input.difficulty,
    xpReward: QUEST_XP_REWARD[input.difficulty],
    status: "active",
    dueDate: input.dueDate ?? null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  });
  save(data);
}

export function guestDeleteQuest(questId: string) {
  const data = load();
  data.quests = data.quests.filter((q) => q.id !== questId);
  save(data);
}

function isSameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isConsecutiveDay(previous: Date, now: Date) {
  const prevMidnight = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((nowMidnight.getTime() - prevMidnight.getTime()) / 86_400_000) === 1;
}

function evaluateBadges(data: GuestData): string[] {
  const doneQuestCount = data.quests.filter((q) => q.status === "done").length;
  const epicDone = data.quests.filter((q) => q.status === "done" && q.difficulty === "epic").length;
  const level = userLevelProgress(data.xp).level;
  const codes: string[] = [];

  if (doneQuestCount >= 1) codes.push("first_quest");
  if (doneQuestCount >= 10) codes.push("quest_10");
  if (doneQuestCount >= 50) codes.push("quest_50");
  if (doneQuestCount >= 100) codes.push("quest_100");
  if (epicDone >= 1) codes.push("epic_quest");
  if (data.currentStreak >= 3) codes.push("streak_3");
  if (data.currentStreak >= 7) codes.push("streak_7");
  if (data.currentStreak >= 30) codes.push("streak_30");
  if (data.totalFocusSeconds >= 3600) codes.push("focus_1h");
  if (data.totalFocusSeconds >= 36000) codes.push("focus_10h");
  if (data.totalFocusSeconds >= 360000) codes.push("focus_100h");
  if (level >= 5) codes.push("level_5");
  if (level >= 10) codes.push("level_10");
  if (level >= 25) codes.push("level_25");

  return codes;
}

function syncBadges(data: GuestData) {
  const unlocked = evaluateBadges(data);
  const already = new Set(data.badgeCodes);
  const newlyEarned = unlocked.filter((c) => !already.has(c));
  data.badgeCodes = [...data.badgeCodes, ...newlyEarned];
  return newlyEarned.map((code) => BADGE_CATALOG.find((b) => b.code === code)!).filter(Boolean);
}

export function guestCompleteQuest(questId: string) {
  const data = load();
  const quest = data.quests.find((q) => q.id === questId);
  if (!quest) throw new GuestServiceError("퀘스트를 찾을 수 없어");
  if (quest.status === "done") throw new GuestServiceError("이미 완료한 퀘스트야");

  const now = new Date();
  const xpGained = QUEST_XP_REWARD[quest.difficulty];
  const beforeLevel = userLevelProgress(data.xp).level;

  let nextStreak = 1;
  if (data.lastQuestCompletedAt) {
    const last = new Date(data.lastQuestCompletedAt);
    if (isSameCalendarDay(last, now)) nextStreak = data.currentStreak || 1;
    else if (isConsecutiveDay(last, now)) nextStreak = data.currentStreak + 1;
  }

  quest.status = "done";
  quest.completedAt = now.toISOString();
  data.xp += xpGained;
  data.currentStreak = nextStreak;
  data.longestStreak = Math.max(data.longestStreak, nextStreak);
  data.lastQuestCompletedAt = now.toISOString();

  const afterLevel = userLevelProgress(data.xp).level;
  const newBadges = syncBadges(data);
  save(data);

  return { xpGained, leveledUp: afterLevel > beforeLevel, newLevel: afterLevel, newBadges };
}

export function guestListenActiveSession(onChange: (session: FocusSession | null) => void) {
  const emit = () => {
    const active = load().focusSessions.find((s) => !s.endedAt);
    onChange(active ? mapSession(active) : null);
  };
  emit();
  return subscribe(emit);
}

export function guestListenRecentSessions(onChange: (sessions: FocusSession[]) => void) {
  const emit = () => {
    const sessions = load()
      .focusSessions.filter((s) => s.endedAt)
      .map(mapSession)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, 20);
    onChange(sessions);
  };
  emit();
  return subscribe(emit);
}

export function guestStartFocusSession() {
  const data = load();
  if (data.focusSessions.some((s) => !s.endedAt)) {
    throw new GuestServiceError("이미 진행 중인 타이머가 있어. 먼저 종료해줘.");
  }
  data.focusSessions.push({
    id: randomId("gf"),
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSeconds: 0,
    xpEarned: 0,
  });
  save(data);
}

export function guestStopFocusSession(sessionId: string) {
  const data = load();
  const session = data.focusSessions.find((s) => s.id === sessionId);
  if (!session) throw new GuestServiceError("타이머를 찾을 수 없어");
  if (session.endedAt) throw new GuestServiceError("이미 종료된 타이머야");

  const now = new Date();
  const durationSeconds = Math.max(0, Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000));
  const xpEarned = xpForFocusSeconds(durationSeconds);
  const beforeLevel = userLevelProgress(data.xp).level;

  session.endedAt = now.toISOString();
  session.durationSeconds = durationSeconds;
  session.xpEarned = xpEarned;
  data.xp += xpEarned;
  data.totalFocusSeconds += durationSeconds;

  const afterLevel = userLevelProgress(data.xp).level;
  const newBadges = syncBadges(data);
  save(data);

  return { xpGained: xpEarned, leveledUp: afterLevel > beforeLevel, newLevel: afterLevel, newBadges };
}
