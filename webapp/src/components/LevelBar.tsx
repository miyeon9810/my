import type { LevelProgress } from "@/types/game";

export function LevelBar({
  progress,
  label,
  size = "md",
}: {
  progress: LevelProgress;
  label?: string;
  size?: "sm" | "md";
}) {
  const barHeight = size === "sm" ? "h-2" : "h-3";
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <span className={size === "sm" ? "text-xs text-slate-400" : "text-sm text-slate-300"}>
          {label} <span className="font-semibold text-violet-300">Lv.{progress.level}</span>
        </span>
        <span className="text-xs text-slate-500 tabular-nums">
          {progress.xpIntoLevel} / {progress.xpForNextLevel} XP
        </span>
      </div>
      <div className={`w-full ${barHeight} rounded-full bg-slate-800 overflow-hidden ring-1 ring-white/5`}>
        <div
          className="xp-bar-fill h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${progress.progressPercent}%` }}
        />
      </div>
    </div>
  );
}
