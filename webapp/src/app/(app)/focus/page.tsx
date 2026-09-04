"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { FocusTimer } from "@/components/FocusTimer";

export default function FocusPage() {
  const { data: partyData } = useSWR<{ parties: { id: string; name: string }[] }>("/api/parties", fetcher);
  const { data: clanData } = useSWR<{ clans: { id: string; name: string }[] }>("/api/clans", fetcher);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">⏱️ 집중 타이머</h1>
        <p className="mt-1 text-sm text-slate-500">
          타이머를 켜고 몰입해봐. 종료하면 분당 1XP를 얻고, 파티·클랜을 선택하면 그 집중 시간이 함께 쌓여.
        </p>
      </div>
      <FocusTimer groups={{ parties: partyData?.parties ?? [], clans: clanData?.clans ?? [] }} />
    </div>
  );
}
