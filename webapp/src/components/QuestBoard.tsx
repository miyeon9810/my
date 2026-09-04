"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher, postJson, deleteJson } from "@/lib/fetcher";
import type { Quest } from "@/types/game";
import type { QuestDifficulty } from "@/lib/leveling";
import { QuestCard } from "./QuestCard";
import { NewQuestForm } from "./NewQuestForm";
import { useRewardToast } from "./reward-toast";

export function QuestBoard({ partyId, clanId }: { partyId?: string; clanId?: string }) {
  const query = new URLSearchParams({ scope: "all" });
  if (partyId) query.set("partyId", partyId);
  if (clanId) query.set("clanId", clanId);
  const key = `/api/quests?${query.toString()}`;

  const { data, mutate } = useSWR<{ quests: Quest[] }>(key, fetcher);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const showReward = useRewardToast();

  const quests = data?.quests ?? [];
  const active = quests.filter((q) => q.status === "active");
  const done = quests.filter((q) => q.status === "done");

  async function handleCreate(input: { title: string; description?: string; difficulty: QuestDifficulty; dueDate?: string }) {
    await postJson("/api/quests", { ...input, partyId, clanId });
    await mutate();
  }

  async function handleComplete(id: string) {
    setPendingId(id);
    try {
      const result = await postJson<{
        xpGained: number;
        leveledUp: boolean;
        newLevel: number;
        newBadges: { id: string; code: string; name: string; description: string; icon: string; tier: "bronze" | "silver" | "gold" | "legendary" }[];
      }>(`/api/quests/${id}/complete`);
      showReward(result);
      await Promise.all([mutate(), globalMutate("/api/me")]);
      if (partyId) await globalMutate(`/api/parties/${partyId}`);
      if (clanId) await globalMutate(`/api/clans/${clanId}`);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    await deleteJson(`/api/quests/${id}`);
    await mutate();
  }

  return (
    <div className="space-y-3">
      <NewQuestForm onSubmit={handleCreate} partyId={partyId} clanId={clanId} />
      {active.length === 0 && done.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-500">진행 중인 퀘스트가 없어. 하나 등록해봐.</p>
      )}
      <div className="space-y-2">
        {active.map((quest) => (
          <QuestCard key={quest.id} quest={quest} onComplete={handleComplete} onDelete={handleDelete} pending={pendingId === quest.id} />
        ))}
      </div>
      {done.length > 0 && (
        <details className="pt-2">
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-300">
            완료한 퀘스트 {done.length}개
          </summary>
          <div className="mt-2 space-y-2">
            {done.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onDelete={handleDelete} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
