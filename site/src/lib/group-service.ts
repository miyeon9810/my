import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  arrayRemove,
  arrayUnion,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userRef } from "@/lib/user-service";
import { toDate } from "@/lib/firestore-utils";
import { generateInviteCode } from "@/lib/invite-code";
import { syncAchievements, grantBadge } from "@/lib/achievements";
import type { Group, GroupMember } from "@/types/game";

export type GroupKind = "party" | "clan";

const COLLECTION: Record<GroupKind, string> = { party: "parties", clan: "clans" };
const CREATE_BADGE: Record<GroupKind, string> = { party: "party_create", clan: "clan_create" };
const USER_ID_FIELD: Record<GroupKind, "partyIds" | "clanIds"> = { party: "partyIds", clan: "clanIds" };

export class GroupServiceError extends Error {}

function groupsCol(kind: GroupKind) {
  return collection(db, COLLECTION[kind]);
}

function membersCol(kind: GroupKind, groupId: string) {
  return collection(db, COLLECTION[kind], groupId, "members");
}

function mapGroup(id: string, data: DocumentData): Group {
  return {
    id,
    name: data.name,
    goal: data.goal ?? null,
    description: data.description ?? null,
    xp: data.xp ?? 0,
    createdBy: data.createdBy,
    createdAt: toDate(data.createdAt),
  };
}

function mapMember(uid: string, data: DocumentData): GroupMember {
  return {
    uid,
    role: data.role,
    joinedAt: toDate(data.joinedAt),
    focusSeconds: data.focusSeconds ?? 0,
    name: data.name ?? null,
    image: data.image ?? null,
  };
}

export async function createGroup(
  kind: GroupKind,
  uid: string,
  member: { name: string | null; image: string | null },
  input: { name: string; goal?: string; description?: string },
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = generateInviteCode();
    const groupDocRef = doc(db, COLLECTION[kind], inviteCode);
    const existing = await getDoc(groupDocRef);
    if (existing.exists()) continue;

    await setDoc(groupDocRef, {
      name: input.name,
      goal: input.goal ?? null,
      description: input.description ?? null,
      xp: 0,
      createdBy: uid,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(membersCol(kind, inviteCode), uid), {
      role: "owner",
      joinedAt: serverTimestamp(),
      focusSeconds: 0,
      name: member.name,
      image: member.image,
    });
    await updateDoc(userRef(uid), { [USER_ID_FIELD[kind]]: arrayUnion(inviteCode) });
    await grantBadge(uid, CREATE_BADGE[kind]);

    return inviteCode;
  }
  throw new GroupServiceError("초대 코드 생성에 실패했어. 다시 시도해줘.");
}

export async function joinGroupByCode(
  kind: GroupKind,
  uid: string,
  member: { name: string | null; image: string | null },
  inviteCode: string,
) {
  const code = inviteCode.trim().toUpperCase();
  const groupDocRef = doc(db, COLLECTION[kind], code);
  const groupSnap = await getDoc(groupDocRef);
  if (!groupSnap.exists()) throw new GroupServiceError("초대 코드를 찾을 수 없어");

  const memberDocRef = doc(membersCol(kind, code), uid);
  const memberSnap = await getDoc(memberDocRef);
  if (memberSnap.exists()) throw new GroupServiceError(`이미 가입한 ${kind === "party" ? "파티" : "클랜"}야`);

  await setDoc(memberDocRef, {
    role: "member",
    joinedAt: serverTimestamp(),
    focusSeconds: 0,
    name: member.name,
    image: member.image,
  });
  await updateDoc(userRef(uid), { [USER_ID_FIELD[kind]]: arrayUnion(code) });
  await syncAchievements(uid);

  return code;
}

export async function leaveGroup(kind: GroupKind, uid: string, groupId: string) {
  const memberDocRef = doc(membersCol(kind, groupId), uid);
  const memberSnap = await getDoc(memberDocRef);
  if (!memberSnap.exists()) throw new GroupServiceError("가입한 그룹이 아니야");

  if (memberSnap.data().role === "owner") {
    const countSnap = await getCountFromServer(membersCol(kind, groupId));
    if (countSnap.data().count > 1) {
      throw new GroupServiceError("리더는 다른 멤버가 남아있으면 나갈 수 없어. 멤버를 내보내거나 그룹을 정리해줘.");
    }
  }

  await deleteDoc(memberDocRef);
  await updateDoc(userRef(uid), { [USER_ID_FIELD[kind]]: arrayRemove(groupId) });
}

export async function fetchGroupsByIds(kind: GroupKind, ids: string[]): Promise<Group[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const snap = await getDocs(query(groupsCol(kind), where(documentId(), "in", chunk)));
      return snap.docs.map((d) => mapGroup(d.id, d.data()));
    }),
  );
  return results.flat();
}

export function listenGroup(kind: GroupKind, groupId: string, onChange: (group: Group | null) => void) {
  return onSnapshot(doc(db, COLLECTION[kind], groupId), (snap) => {
    onChange(snap.exists() ? mapGroup(snap.id, snap.data()) : null);
  });
}

export function listenGroupMembers(kind: GroupKind, groupId: string, onChange: (members: GroupMember[]) => void) {
  return onSnapshot(membersCol(kind, groupId), (snap) => {
    const members = snap.docs.map((d) => mapMember(d.id, d.data()));
    members.sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
      return (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0);
    });
    onChange(members);
  });
}

// Used by the focus timer to attribute a completed session's time+XP to a
// group and its member document in a single transaction.
export async function addGroupFocus(kind: GroupKind, groupId: string, uid: string, durationSeconds: number, xpEarned: number) {
  const groupDocRef = doc(db, COLLECTION[kind], groupId);
  const memberDocRef = doc(membersCol(kind, groupId), uid);

  await runTransaction(db, async (tx) => {
    const [groupSnap, memberSnap] = await Promise.all([tx.get(groupDocRef), tx.get(memberDocRef)]);
    if (groupSnap.exists()) tx.update(groupDocRef, { xp: (groupSnap.data().xp ?? 0) + xpEarned });
    if (memberSnap.exists()) {
      tx.update(memberDocRef, { focusSeconds: (memberSnap.data().focusSeconds ?? 0) + durationSeconds });
    }
  });
}
