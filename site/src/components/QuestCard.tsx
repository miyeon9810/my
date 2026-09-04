import { QUEST_DIFFICULTY_LABEL, type QuestDifficulty } from "@/lib/leveling";
import type { Quest } from "@/types/game";

const DIFFICULTY_STYLE: Record<QuestDifficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  normal: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  hard: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  epic: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30",
};

export function QuestCard({
  quest,
  onComplete,
  onDelete,
  pending,
}: {
  quest: Quest;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  pending?: boolean;
}) {
  const isDone = quest.status === "done";
  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 transition ${
        isDone ? "opacity-60" : "hover:border-violet-500/40"
      }`}
    >
      {onComplete && (
        <button
          type="button"
          disabled={isDone || pending}
          onClick={() => onComplete(quest.id)}
          aria-label="퀘스트 완료"
          className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 transition ${
            isDone
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-600 hover:border-violet-400 hover:bg-violet-500/10"
          } flex items-center justify-center text-xs disabled:cursor-not-allowed`}
        >
          {isDone ? "✓" : ""}
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`font-medium ${isDone ? "line-through text-slate-500" : "text-slate-100"}`}>
            {quest.title}
          </h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${DIFFICULTY_STYLE[quest.difficulty]}`}>
            {QUEST_DIFFICULTY_LABEL[quest.difficulty]}
          </span>
          <span className="text-xs text-amber-400 font-semibold">+{quest.xpReward} XP</span>
          {quest.partyId && (
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-300 ring-1 ring-indigo-500/30">
              🤝 파티
            </span>
          )}
          {quest.clanId && (
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-300 ring-1 ring-rose-500/30">
              🏰 클랜
            </span>
          )}
        </div>
        {quest.description && <p className="mt-1 text-sm text-slate-400">{quest.description}</p>}
        {quest.dueDate && (
          <p className="mt-1 text-xs text-slate-500">마감 {quest.dueDate.toLocaleDateString("ko-KR")}</p>
        )}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(quest.id)}
          className="shrink-0 text-slate-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
          aria-label="퀘스트 삭제"
        >
          ✕
        </button>
      )}
    </div>
  );
}
