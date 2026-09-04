import {
  addDoc,
  collection,
  doc,
  getDocs,
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
import { userLevelProgress, xpForFocusSeconds } from "@/lib/leveling";
import { syncAchievements } from "@/lib/achievements";
import { addGroupFocus, type GroupKind } from "@/lib/group-service";
import type { FocusSession } from "@/types/game";

function sessionsCol() {
  return collection(db, "focusSessions");
}

export class FocusServiceError extends Error {}

function mapSession(id: string, data: DocumentData): FocusSession {
  return {
    id,
    userId: data.userId,
    questId: data.questId ?? null,
    partyId: data.partyId ?? null,
    clanId: data.clanId ?? null,
    startedAt: toDate(data.startedAt) ?? new Date(),
    endedAt: toDate(data.endedAt),
    durationSeconds: data.durationSeconds ?? 0,
    xpEarned: data.xpEarned ?? 0,
  };
}

export function listenActiveSession(uid: string, onChange: (session: FocusSession | null) => void) {
  const q = query(sessionsCol(), where("userId", "==", uid), where("endedAt", "==", null));
  return onSnapshot(q, (snap) => {
    onChange(snap.empty ? null : mapSession(snap.docs[0].id, snap.docs[0].data()));
  });
}

export function listenRecentSessions(uid: string, onChange: (sessions: FocusSession[]) => void) {
  const q = query(sessionsCol(), where("userId", "==", uid));
  return onSnapshot(q, (snap) => {
    const sessions = snap.docs
      .map((d) => mapSession(d.id, d.data()))
      .filter((s) => s.endedAt)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, 20);
    onChange(sessions);
  });
}

export async function startFocusSession(
  uid: string,
  input: { questId?: string | null; partyId?: string | null; clanId?: string | null },
) {
  const activeQuery = query(sessionsCol(), where("userId", "==", uid), where("endedAt", "==", null));
  const activeSnap = await getDocs(activeQuery);
  if (!activeSnap.empty) throw new FocusServiceError("이미 진행 중인 타이머가 있어. 먼저 종료해줘.");

  const docRef = await addDoc(sessionsCol(), {
    userId: uid,
    questId: input.questId ?? null,
    partyId: input.partyId ?? null,
    clanId: input.clanId ?? null,
    startedAt: serverTimestamp(),
    endedAt: null,
    durationSeconds: 0,
    xpEarned: 0,
  });
  return docRef.id;
}

export async function stopFocusSession(uid: string, sessionId: string) {
  const sessionDocRef = doc(db, "focusSessions", sessionId);
  const userDocRef = userRef(uid);

  const result = await runTransaction(db, async (tx) => {
    const sessionSnap = await tx.get(sessionDocRef);
    if (!sessionSnap.exists()) throw new FocusServiceError("타이머를 찾을 수 없어");
    const session = sessionSnap.data();
    if (session.userId !== uid) throw new FocusServiceError("타이머를 찾을 수 없어");
    if (session.endedAt) throw new FocusServiceError("이미 종료된 타이머야");

    const userSnap = await tx.get(userDocRef);
    if (!userSnap.exists()) throw new FocusServiceError("유저 정보를 찾을 수 없어");
    const user = userSnap.data();

    const now = new Date();
    const startedAt: Date = toDate(session.startedAt) ?? now;
    const durationSeconds = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000));
    const xpEarned = xpForFocusSeconds(durationSeconds);
    const beforeLevel = userLevelProgress(user.xp ?? 0).level;
    const nextXp = (user.xp ?? 0) + xpEarned;
    const afterLevel = userLevelProgress(nextXp).level;

    tx.update(sessionDocRef, {
      endedAt: Timestamp.fromDate(now),
      durationSeconds,
      xpEarned,
    });
    tx.update(userDocRef, {
      xp: nextXp,
      level: afterLevel,
      totalFocusSeconds: (user.totalFocusSeconds ?? 0) + durationSeconds,
    });

    return {
      durationSeconds,
      xpGained: xpEarned,
      leveledUp: afterLevel > beforeLevel,
      newLevel: afterLevel,
      partyId: (session.partyId as string | null) ?? null,
      clanId: (session.clanId as string | null) ?? null,
    };
  });

  const groupWrites: Promise<void>[] = [];
  if (result.partyId) groupWrites.push(addGroupFocus("party" as GroupKind, result.partyId, uid, result.durationSeconds, result.xpGained));
  if (result.clanId) groupWrites.push(addGroupFocus("clan" as GroupKind, result.clanId, uid, result.durationSeconds, result.xpGained));
  await Promise.all(groupWrites);

  const newBadges = await syncAchievements(uid);
  return { ...result, newBadges };
}
