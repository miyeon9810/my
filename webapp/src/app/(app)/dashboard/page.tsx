"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Me } from "@/types/game";
import { LevelBar } from "@/components/LevelBar";
import { QuestBoard } from "@/components/QuestBoard";

function formatFocus(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}분`;
  return `${hours}시간 ${minutes}분`;
}

export default function DashboardPage() {
  const { data } = useSWR<{ user: Me }>("/api/me", fetcher);
  const me = data?.user;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 p-5">
        {me ? (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-slate-100">{me.name ?? "모험가"}님의 여정</h1>
              <div className="flex gap-4 text-xs text-slate-400">
                <span>🔥 연속 {me.currentStreak}일</span>
                <span>✅ 완료 {me.questsCompleted}개</span>
                <span>⏱️ 집중 {formatFocus(me.totalFocusSeconds)}</span>
              </div>
            </div>
            <div className="mt-4">
              <LevelBar progress={me.progress} label="전체 경험치" />
            </div>
          </>
        ) : (
          <div className="h-16 animate-pulse rounded-lg bg-white/5" />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">오늘의 퀘스트</h2>
        <QuestBoard />
      </section>
    </div>
  );
}
