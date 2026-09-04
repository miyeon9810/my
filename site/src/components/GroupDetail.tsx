import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { listenGroup, listenGroupMembers, leaveGroup, type GroupKind } from "@/lib/group-service";
import { partyLevelProgress, clanLevelProgress } from "@/lib/leveling";
import type { Group, GroupMember } from "@/types/game";
import { LevelBar } from "./LevelBar";
import { QuestBoard } from "./QuestBoard";
import { FocusTimer } from "./FocusTimer";

export function GroupDetail({ kind, id }: { kind: GroupKind; id: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const listPath = kind === "party" ? "/parties" : "/clans";
  const levelProgress = kind === "party" ? partyLevelProgress : clanLevelProgress;

  const [group, setGroup] = useState<Group | null | undefined>(undefined);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const un1 = listenGroup(kind, id, setGroup);
    const un2 = listenGroupMembers(kind, id, setMembers);
    return () => {
      un1();
      un2();
    };
  }, [kind, id]);

  if (group === undefined) return <div className="h-40 animate-pulse rounded-xl bg-white/5" />;
  if (group === null) return <p className="text-sm text-slate-500">그룹을 찾을 수 없어.</p>;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — the code is shown on screen either way
    }
  }

  async function handleLeave() {
    if (!user) return;
    if (!confirm(`정말 ${kind === "party" ? "파티" : "클랜"}에서 나갈래?`)) return;
    setLeaving(true);
    try {
      await leaveGroup(kind, user.uid, id);
      navigate(listPath);
    } catch (err) {
      alert(err instanceof Error ? err.message : "탈퇴에 실패했어");
      setLeaving(false);
    }
  }

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
          초대 코드 <span className="font-mono font-bold tracking-widest text-violet-300">{id}</span>
          {copied ? "✓ 복사됨" : "복사"}
        </button>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">멤버 ({members.length})</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {members.map((m) => (
            <li key={m.uid} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3">
              {m.image ? (
                <img src={m.image} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-700" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">
                  {m.name ?? "모험가"} {m.role === "owner" && <span className="text-amber-400">👑</span>}
                </p>
                <p className="text-xs text-slate-500">집중 {Math.round(m.focusSeconds / 60)}분</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">함께 집중하기</h2>
        <FocusTimer {...(kind === "party" ? { partyId: id } : { clanId: id })} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">퀘스트 보드</h2>
        <QuestBoard {...(kind === "party" ? { partyId: id } : { clanId: id })} />
      </section>
    </div>
  );
}
