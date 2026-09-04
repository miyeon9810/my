import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createGroup, fetchGroupsByIds, joinGroupByCode, type GroupKind } from "@/lib/group-service";
import { partyLevelProgress, clanLevelProgress } from "@/lib/leveling";
import type { Group } from "@/types/game";
import { LevelBar } from "./LevelBar";

export function GroupList({
  kind,
  title,
  emoji,
  description,
}: {
  kind: GroupKind;
  title: string;
  emoji: string;
  description: string;
}) {
  const { user, profile } = useAuth();
  const ids = kind === "party" ? profile?.partyIds ?? [] : profile?.clanIds ?? [];
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const detailBase = kind === "party" ? "/parties" : "/clans";
  const levelProgress = kind === "party" ? partyLevelProgress : clanLevelProgress;

  useEffect(() => {
    fetchGroupsByIds(kind, ids).then(setGroups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, ids.join(","), refreshKey]);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createGroup(kind, user.uid, { name: user.displayName, image: user.photoURL }, { name: name.trim(), goal: goal.trim() || undefined });
      setName("");
      setGoal("");
      setShowCreate(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성에 실패했어");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await joinGroupByCode(kind, user.uid, { name: user.displayName, image: user.photoURL }, inviteCode);
      setInviteCode("");
      setShowJoin(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "가입에 실패했어");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">
          {emoji} {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setShowCreate((v) => !v);
            setShowJoin(false);
          }}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          + 새로 만들기
        </button>
        <button
          type="button"
          onClick={() => {
            setShowJoin((v) => !v);
            setShowCreate(false);
          }}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:border-violet-500/40"
        >
          초대 코드로 참여
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-2 rounded-xl border border-violet-500/30 bg-slate-900/70 p-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === "party" ? "파티 이름 (예: 토익 900 뿌수기)" : "클랜 이름 (예: 공무원 합격반)"}
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
          />
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="목표 (선택)"
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              만들기
            </button>
          </div>
        </form>
      )}

      {showJoin && (
        <form onSubmit={handleJoin} className="space-y-2 rounded-xl border border-violet-500/30 bg-slate-900/70 p-4">
          <input
            autoFocus
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="초대 코드 (예: AB12CD)"
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm uppercase tracking-widest text-slate-100 outline-none focus:border-violet-500"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              참여하기
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <Link
            key={g.id}
            to={`${detailBase}/${g.id}`}
            className="rounded-xl border border-white/10 bg-slate-900/60 p-4 transition hover:border-violet-500/40"
          >
            <h3 className="font-medium text-slate-100">{g.name}</h3>
            {g.goal && <p className="mt-0.5 text-xs text-slate-500">🎯 {g.goal}</p>}
            <div className="mt-3">
              <LevelBar progress={levelProgress(g.xp)} size="sm" />
            </div>
          </Link>
        ))}
      </div>
      {groups.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-500">
          아직 {kind === "party" ? "파티" : "클랜"}가 없어. 새로 만들거나 초대 코드로 참여해봐.
        </p>
      )}
    </div>
  );
}
