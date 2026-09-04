import { useState } from "react";
import { QUEST_DIFFICULTIES, QUEST_DIFFICULTY_LABEL, QUEST_XP_REWARD, type QuestDifficulty } from "@/lib/leveling";

export function NewQuestForm({
  onSubmit,
  partyId,
  clanId,
}: {
  onSubmit: (input: { title: string; description?: string; difficulty: QuestDifficulty; dueDate?: string }) => Promise<void>;
  partyId?: string;
  clanId?: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("normal");
  const [dueDate, setDueDate] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setDifficulty("normal");
    setDueDate("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-white/15 py-3 text-sm text-slate-400 transition hover:border-violet-500/50 hover:text-violet-300"
      >
        + 새 퀘스트{partyId ? " (파티)" : clanId ? " (클랜)" : ""} 등록
      </button>
    );
  }

  return (
    <form
      className="rounded-xl border border-violet-500/30 bg-slate-900/70 p-4 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSubmitting(true);
        setError(null);
        try {
          await onSubmit({
            title: title.trim(),
            description: description.trim() || undefined,
            difficulty,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          });
          reset();
          setOpen(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "등록에 실패했어");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="퀘스트 제목"
        className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="설명 (선택)"
        rows={2}
        className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {QUEST_DIFFICULTIES.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                difficulty === d
                  ? "bg-violet-500 text-white ring-violet-400"
                  : "bg-slate-800 text-slate-400 ring-white/10 hover:ring-violet-500/40"
              }`}
            >
              {QUEST_DIFFICULTY_LABEL[d]} +{QUEST_XP_REWARD[d]}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-300 outline-none focus:border-violet-500"
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {submitting ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}
