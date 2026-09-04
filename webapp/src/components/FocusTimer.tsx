"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher, postJson } from "@/lib/fetcher";
import { useRewardToast } from "./reward-toast";
import type { Badge } from "@/types/game";

type ActiveSession = {
  id: string;
  startedAt: string;
  partyId: string | null;
  clanId: string | null;
};

type FocusSessionsResponse = {
  active: ActiveSession | null;
  recent: {
    id: string;
    startedAt: string;
    durationSeconds: number;
    xpEarned: number;
    party: { id: string; name: string } | null;
    clan: { id: string; name: string } | null;
  }[];
};

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function FocusTimer({
  partyId,
  clanId,
  groups,
}: {
  partyId?: string;
  clanId?: string;
  groups?: { parties: { id: string; name: string }[]; clans: { id: string; name: string }[] };
}) {
  const { data, mutate } = useSWR<FocusSessionsResponse>("/api/focus-sessions", fetcher);
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState<string>(partyId ? `party:${partyId}` : clanId ? `clan:${clanId}` : "solo");
  const [starting, setStarting] = useState(false);
  const showReward = useRewardToast();

  const active = data?.active ?? null;

  useEffect(() => {
    if (!active) return;
    const start = new Date(active.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  const displaySeconds = active ? elapsed : 0;

  async function handleStart() {
    setStarting(true);
    try {
      const [kind, id] = target.split(":");
      await postJson("/api/focus-sessions", {
        partyId: kind === "party" ? id : undefined,
        clanId: kind === "clan" ? id : undefined,
      });
      await mutate();
    } finally {
      setStarting(false);
    }
  }

  async function handleStop() {
    if (!active) return;
    const result = await postJson<{
      xpGained: number;
      leveledUp: boolean;
      newLevel: number;
      newBadges: Badge[];
    }>(`/api/focus-sessions/${active.id}/stop`);
    showReward(result);
    await Promise.all([mutate(), globalMutate("/api/me")]);
    if (active.partyId) await globalMutate(`/api/parties/${active.partyId}`);
    if (active.clanId) await globalMutate(`/api/clans/${active.clanId}`);
  }

  const fixedTarget = Boolean(partyId || clanId);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-xs text-slate-500">
            {active ? "집중 중이야" : "집중 타이머를 시작해봐"}
          </p>
          <p className="font-mono text-4xl font-bold text-violet-300 tabular-nums">{formatDuration(displaySeconds)}</p>
        </div>
        <div className="flex flex-col items-stretch gap-2">
          {!active && !fixedTarget && groups && (groups.parties.length > 0 || groups.clans.length > 0) && (
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-violet-500"
            >
              <option value="solo">개인 집중</option>
              {groups.parties.map((p) => (
                <option key={p.id} value={`party:${p.id}`}>
                  🤝 {p.name}
                </option>
              ))}
              {groups.clans.map((c) => (
                <option key={c.id} value={`clan:${c.id}`}>
                  🏰 {c.name}
                </option>
              ))}
            </select>
          )}
          {active ? (
            <button
              type="button"
              onClick={handleStop}
              className="rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              종료하고 XP 받기
            </button>
          ) : (
            <button
              type="button"
              disabled={starting}
              onClick={handleStart}
              className="rounded-full bg-violet-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              시작
            </button>
          )}
        </div>
      </div>

      {data && data.recent.length > 0 && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">최근 기록</p>
          <ul className="space-y-1.5 text-sm">
            {data.recent.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center justify-between text-slate-400">
                <span>
                  {new Date(s.startedAt).toLocaleDateString("ko-KR")}
                  {s.party && ` · 🤝 ${s.party.name}`}
                  {s.clan && ` · 🏰 ${s.clan.name}`}
                </span>
                <span className="tabular-nums text-slate-300">
                  {formatDuration(s.durationSeconds)}{" "}
                  <span className="text-amber-400">+{s.xpEarned}XP</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
