import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/firestore-utils";
import { userRef } from "@/lib/user-service";
import {
  QUEST_XP_REWARD,
  userLevelProgress,
  type QuestDifficulty,
} from "@/lib/leveling";
import { syncAchievements } from "@/lib/achievements";
import {
  guestCompleteQuest,
  guestCreateQuest,
  guestDeleteQuest,
  guestListenUserQuests,
  isGuestQuestId,
  isGuestUid,
} from "@/lib/guest-store";
import type { Quest } from "@/types/game";

function questsCol() {
  return collection(db, "quests");
}

function mapQuest(id: string, data: DocumentData): Quest {
  return {
    id,
    userId: data.userId,
    title: data.title,
    description: data.description ?? null,
    difficulty: data.difficulty,
    xpReward: data.xpReward ?? 0,
    status: data.status,
    dueDate: toDate(data.dueDate),
    completedAt: toDate(data.completedAt),
    createdAt: toDate(data.createdAt),
    partyId: data.partyId ?? null,
    clanId: data.clanId ?? null,
  };
}

function sortByCreatedDesc(quests: Quest[]) {
  return [...quests].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export function listenUserQuests(uid: string, onChange: (quests: Quest[]) => void) {
  if (isGuestUid(uid)) return guestListenUserQuests(onChange);
  const q = query(questsCol(), where("userId", "==", uid));
  return onSnapshot(q, (snap) => {
    onChange(sortByCreatedDesc(snap.docs.map((d) => mapQuest(d.id, d.data()))));
  });
}

export function listenGroupQuests(
  field: "partyId" | "clanId",
  groupId: string,
  onChange: (quests: Quest[]) => void,
) {
  const q = query(questsCol(), where(field, "==", groupId));
  return onSnapshot(q, (snap) => {
    onChange(sortByCreatedDesc(snap.docs.map((d) => mapQuest(d.id, d.data()))));
  });
}

export async function createQuest(
  uid: string,
  input: {
    title: string;
    description?: string;
    difficulty: QuestDifficulty;
    dueDate?: string;
    partyId?: string | null;
    clanId?: string | null;
  },
) {
  if (isGuestUid(uid)) return guestCreateQuest(input);
  await addDoc(questsCol(), {
    userId: uid,
    title: input.title,
    description: input.description ?? null,
    difficulty: input.difficulty,
    xpReward: QUEST_XP_REWARD[input.difficulty],
    status: "active",
    dueDate: input.dueDate ? Timestamp.fromDate(new Date(input.dueDate)) : null,
    completedAt: null,
    partyId: input.partyId ?? null,
    clanId: input.clanId ?? null,
    createdAt: serverTimestamp(),
  });
}

export async function deleteQuest(questId: string) {
  if (isGuestQuestId(questId)) return guestDeleteQuest(questId);
  await deleteDoc(doc(db, "quests", questId));
}

function isSameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isConsecutiveDay(previous: Date, now: Date) {
  const prevMidnight = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowMidnight.getTime() - prevMidnight.getTime()) / 86_400_000);
  return diffDays === 1;
}

export class QuestServiceError extends Error {}

// Completes a quest: awards XP to the user (and the quest's party/clan, if
// any), updates the daily streak, then syncs badge unlocks as a follow-up
// step (kept outside the transaction since it needs count() reads).
export async function completeQuest(uid: string, questId: string) {
  if (isGuestUid(uid)) return guestCompleteQuest(questId);
  const questDocRef = doc(db, "quests", questId);
  const userDocRef = userRef(uid);

  const result = await runTransaction(db, async (tx) => {
    const questSnap = await tx.get(questDocRef);
    if (!questSnap.exists()) throw new QuestServiceError("퀘스트를 찾을 수 없어");
    const quest = questSnap.data();
    if (quest.userId !== uid) throw new QuestServiceError("퀘스트를 찾을 수 없어");
    if (quest.status === "done") throw new QuestServiceError("이미 완료한 퀘스트야");

    const userSnap = await tx.get(userDocRef);
    if (!userSnap.exists()) throw new QuestServiceError("유저 정보를 찾을 수 없어");
    const user = userSnap.data();

    const now = new Date();
    const xpGained: number = QUEST_XP_REWARD[quest.difficulty as QuestDifficulty] ?? quest.xpReward ?? 0;
    const beforeLevel = userLevelProgress(user.xp ?? 0).level;

    let nextStreak = 1;
    const lastCompleted = toDate(user.lastQuestCompletedAt);
    if (lastCompleted) {
      if (isSameCalendarDay(lastCompleted, now)) nextStreak = user.currentStreak || 1;
      else if (isConsecutiveDay(lastCompleted, now)) nextStreak = (user.currentStreak ?? 0) + 1;
    }
    const nextXp = (user.xp ?? 0) + xpGained;
    const afterLevel = userLevelProgress(nextXp).level;

    tx.update(questDocRef, { status: "done", completedAt: Timestamp.fromDate(now) });
    tx.update(userDocRef, {
      xp: nextXp,
      level: afterLevel,
      currentStreak: nextStreak,
      longestStreak: Math.max(user.longestStreak ?? 0, nextStreak),
      lastQuestCompletedAt: Timestamp.fromDate(now),
    });

    if (quest.partyId) {
      const partyDocRef = doc(db, "parties", quest.partyId);
      const partySnap = await tx.get(partyDocRef);
      if (partySnap.exists()) {
        const nextPartyXp = (partySnap.data().xp ?? 0) + xpGained;
        tx.update(partyDocRef, { xp: nextPartyXp });
      }
    }
    if (quest.clanId) {
      const clanDocRef = doc(db, "clans", quest.clanId);
      const clanSnap = await tx.get(clanDocRef);
      if (clanSnap.exists()) {
        const nextClanXp = (clanSnap.data().xp ?? 0) + xpGained;
        tx.update(clanDocRef, { xp: nextClanXp });
      }
    }

    return { xpGained, leveledUp: afterLevel > beforeLevel, newLevel: afterLevel };
  });

  const newBadges = await syncAchievements(uid);
  return { ...result, newBadges };
}
