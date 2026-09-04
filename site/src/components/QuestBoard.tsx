import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listenGroupQuests, listenUserQuests, createQuest, completeQuest, deleteQuest } from "@/lib/quest-service";
import type { Quest } from "@/types/game";
import type { QuestDifficulty } from "@/lib/leveling";
import { QuestCard } from "./QuestCard";
import { NewQuestForm } from "./NewQuestForm";
import { useRewardToast } from "./reward-toast";

export function QuestBoard({ partyId, clanId }: { partyId?: string; clanId?: string }) {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const showReward = useRewardToast();

  useEffect(() => {
    if (!user) return;
    if (partyId) return listenGroupQuests("partyId", partyId, setQuests);
    if (clanId) return listenGroupQuests("clanId", clanId, setQuests);
    return listenUserQuests(user.uid, setQuests);
  }, [user, partyId, clanId]);

  const active = quests.filter((q) => q.status === "active");
  const done = quests.filter((q) => q.status === "done");

  async function handleCreate(input: { title: string; description?: string; difficulty: QuestDifficulty; dueDate?: string }) {
    if (!user) return;
    await createQuest(user.uid, { ...input, partyId, clanId });
  }

  async function handleComplete(id: string) {
    if (!user) return;
    setPendingId(id);
    try {
      const result = await completeQuest(user.uid, id);
      showReward(result);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    await deleteQuest(id);
  }

  const myQuestOnly = !partyId && !clanId;

  return (
    <div className="space-y-3">
      <NewQuestForm onSubmit={handleCreate} partyId={partyId} clanId={clanId} />
      {active.length === 0 && done.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-500">진행 중인 퀘스트가 없어. 하나 등록해봐.</p>
      )}
      <div className="space-y-2">
        {active.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onComplete={myQuestOnly || quest.userId === user?.uid ? handleComplete : undefined}
            onDelete={quest.userId === user?.uid ? handleDelete : undefined}
            pending={pendingId === quest.id}
          />
        ))}
      </div>
      {done.length > 0 && (
        <details className="pt-2">
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-300">
            완료한 퀘스트 {done.length}개
          </summary>
          <div className="mt-2 space-y-2">
            {done.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onDelete={quest.userId === user?.uid ? handleDelete : undefined}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
