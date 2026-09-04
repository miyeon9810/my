"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Me } from "@/types/game";
import { LevelBar } from "@/components/LevelBar";
import { BadgeGrid } from "@/components/BadgeGrid";

export default function AchievementsPage() {
  const { data } = useSWR<{ user: Me }>("/api/me", fetcher);
  const me = data?.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">🏆 업적</h1>
        <p className="mt-1 text-sm text-slate-500">
          퀘스트를 완료하고, 연속 기록을 쌓고, 집중 시간을 채우고, 파티·클랜에 합류하면 뱃지가 열려.
        </p>
      </div>

      {me && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <span>
              획득한 뱃지 <span className="font-semibold text-violet-300">{me.badges.length}</span>개
            </span>
            <span>🔥 최장 연속 {me.longestStreak}일</span>
          </div>
          <div className="mt-3">
            <LevelBar progress={me.progress} label="전체 경험치" />
          </div>
        </div>
      )}

      <BadgeGrid />
    </div>
  );
}
