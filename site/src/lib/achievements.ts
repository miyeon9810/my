import {
  arrayUnion,
  collection,
  getCountFromServer,
  getDoc,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userRef, mapUserProfile } from "@/lib/user-service";
import { userLevelProgress } from "@/lib/leveling";
import { BADGE_CATALOG, type BadgeDefinition } from "@/lib/badges";

export { BADGE_CATALOG, BADGE_TIER_LABEL, type BadgeTier, type BadgeDefinition } from "@/lib/badges";

function questsCol() {
  return collection(db, "quests");
}

async function evaluateUnlockedCodes(uid: string): Promise<string[]> {
  const userSnap = await getDoc(userRef(uid));
  if (!userSnap.exists()) return [];
  const user = mapUserProfile(userSnap.id, userSnap.data());

  const [doneCount, epicCount] = await Promise.all([
    getCountFromServer(query(questsCol(), where("userId", "==", uid), where("status", "==", "done"))),
    getCountFromServer(
      query(questsCol(), where("userId", "==", uid), where("status", "==", "done"), where("difficulty", "==", "epic")),
    ),
  ]);

  const doneQuestCount = doneCount.data().count;
  const epicDone = epicCount.data().count;
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

  if (user.partyIds.length >= 1) codes.push("party_join");
  if (user.clanIds.length >= 1) codes.push("clan_join");

  return codes;
}

// Re-evaluates every unlock rule for a user and grants any badges they now
// qualify for but don't already have yet. `party_create`/`clan_create` are
// granted directly by createParty/createClan since ownership isn't tracked
// on the user doc. Returns the newly-earned badge definitions.
export async function syncAchievements(uid: string): Promise<BadgeDefinition[]> {
  const [unlockedCodes, userSnap] = await Promise.all([evaluateUnlockedCodes(uid), getDoc(userRef(uid))]);
  if (!userSnap.exists()) return [];

  const alreadyHave = new Set<string>(userSnap.data().badgeCodes ?? []);
  const newlyEarned = unlockedCodes.filter((code) => !alreadyHave.has(code));
  if (newlyEarned.length === 0) return [];

  await updateDoc(userRef(uid), { badgeCodes: arrayUnion(...newlyEarned) });

  const byCode = new Map(BADGE_CATALOG.map((b) => [b.code, b]));
  return newlyEarned.map((code) => byCode.get(code)).filter((b): b is BadgeDefinition => Boolean(b));
}

// Directly grants a single badge (used for one-off events like creating a
// party/clan, which aren't derivable from the user doc alone).
export async function grantBadge(uid: string, code: string) {
  await updateDoc(userRef(uid), { badgeCodes: arrayUnion(code) });
}
