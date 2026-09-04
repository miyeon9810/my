"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { fetcher, postJson } from "@/lib/fetcher";
import { partyLevelProgress, clanLevelProgress } from "@/lib/leveling";
import { LevelBar } from "./LevelBar";
import { QuestBoard } from "./QuestBoard";
import { FocusTimer } from "./FocusTimer";

type Member = {
  id: string;
  role: "owner" | "member";
  focusSeconds: number;
  user: { id: string; name: string | null; image: string | null };
};

type GroupDetailData = {
  id: string;
  name: string;
  goal: string | null;
  description: string | null;
  inviteCode: string;
  xp: number;
  level: number;
  createdById: string;
  members: Member[];
};

export function GroupDetail({ kind, id }: { kind: "party" | "clan"; id: string }) {
  const router = useRouter();
  const apiBase = kind === "party" ? "/api/parties" : "/api/clans";
  const dataKey = kind === "party" ? "party" : "clan";
  const listPath = kind === "party" ? "/parties" : "/clans";
  const levelProgress = kind === "party" ? partyLevelProgress : clanLevelProgress;

  const { data } = useSWR<Record<string, GroupDetailData>>(`${apiBase}/${id}`, fetcher);
  const group = data?.[dataKey];
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (!group) {
    return <div className="h-40 animate-pulse rounded-xl bg-white/5" />;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(group!.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore, code is shown on screen anyway
    }
  }

  async function handleLeave() {
    if (!confirm(`정말 ${kind === "party" ? "파티" : "클랜"}에서 나갈래?`)) return;
    setLeaving(true);
    try {
      await postJson(`${apiBase}/${id}/leave`);
      router.push(listPath);
    } catch (err) {
      alert(err instanceof Error ? err.message : "탈퇴에 실패했어");
      setLeaving(false);
    }
  }

  const groupsProp =
    kind === "party"
      ? { parties: [{ id: group.id, name: group.name }], clans: [] }
      : { parties: [], clans: [{ id: group.id, name: group.name }] };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {kind === "party" ? "🤝" : "🏰"} {group.name}
            </h1>
            {group.goal && <p className="mt-0.5 text-sm text-slate-400">🎯 {group.goal}</p>}
            {group.description && <p className="mt-1 text-sm text-slate-500">{group.description}</p>}
          </div>
          <button
            type="button"
            onClick={handleLeave}
            disabled={leaving}
            className="text-xs text-slate-500 hover:text-rose-400 disabled:opacity-50"
          >
            나가기
          </button>
        </div>
        <div className="mt-4">
          <LevelBar progress={levelProgress(group.xp)} label={`${kind === "party" ? "파티" : "클랜"} 경험치`} />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500/40"
        >
          초대 코드 <span className="font-mono font-bold tracking-widest text-violet-300">{group.inviteCode}</span>
          {copied ? "✓ 복사됨" : "복사"}
        </button>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">멤버 ({group.members.length})</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3">
              {m.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.user.image} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-700" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">
                  {m.user.name ?? "모험가"} {m.role === "owner" && <span className="text-amber-400">👑</span>}
                </p>
                <p className="text-xs text-slate-500">집중 {Math.round(m.focusSeconds / 60)}분</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">함께 집중하기</h2>
        <FocusTimer {...(kind === "party" ? { partyId: id } : { clanId: id })} groups={groupsProp} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">퀘스트 보드</h2>
        <QuestBoard {...(kind === "party" ? { partyId: id } : { clanId: id })} />
      </section>
    </div>
  );
}
