import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, type DocumentData } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/firestore-utils";
import type { UserProfile } from "@/types/game";

export function userRef(uid: string) {
  return doc(db, "users", uid);
}

export function mapUserProfile(id: string, data: DocumentData): UserProfile {
  return {
    id,
    name: data.name ?? null,
    email: data.email ?? null,
    image: data.image ?? null,
    xp: data.xp ?? 0,
    level: data.level ?? 1,
    totalFocusSeconds: data.totalFocusSeconds ?? 0,
    currentStreak: data.currentStreak ?? 0,
    longestStreak: data.longestStreak ?? 0,
    lastQuestCompletedAt: toDate(data.lastQuestCompletedAt),
    badgeCodes: data.badgeCodes ?? [],
    partyIds: data.partyIds ?? [],
    clanIds: data.clanIds ?? [],
    createdAt: toDate(data.createdAt),
  };
}

// Creates the Firestore profile doc on first sign-in, or refreshes the
// display name/photo on subsequent sign-ins without touching game state.
export async function ensureUserDoc(user: FirebaseUser) {
  const ref = userRef(user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName ?? null,
      email: user.email ?? null,
      image: user.photoURL ?? null,
      xp: 0,
      level: 1,
      totalFocusSeconds: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastQuestCompletedAt: null,
      badgeCodes: [],
      partyIds: [],
      clanIds: [],
      createdAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      ref,
      { name: user.displayName ?? null, image: user.photoURL ?? null },
      { merge: true },
    );
  }
}

export function subscribeUserProfile(uid: string, onChange: (profile: UserProfile | null) => void) {
  return onSnapshot(userRef(uid), (snap) => {
    onChange(snap.exists() ? mapUserProfile(snap.id, snap.data()) : null);
  });
}
