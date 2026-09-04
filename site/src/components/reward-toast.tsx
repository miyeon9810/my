import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { BadgeDefinition } from "@/lib/badges";

type RewardEvent = {
  id: number;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  newBadges: BadgeDefinition[];
};

type ShowRewardInput = Omit<RewardEvent, "id">;

const RewardToastContext = createContext<((reward: ShowRewardInput) => void) | null>(null);

export function useRewardToast() {
  const ctx = useContext(RewardToastContext);
  if (!ctx) throw new Error("useRewardToast must be used within RewardToastProvider");
  return ctx;
}

export function RewardToastProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<RewardEvent[]>([]);
  const idRef = useRef(0);

  const showReward = useCallback((reward: ShowRewardInput) => {
    const id = ++idRef.current;
    setEvents((prev) => [...prev, { ...reward, id }]);
    setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }, 3600);
  }, []);

  return (
    <RewardToastContext.Provider value={showReward}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {events.map((event) => (
          <div
            key={event.id}
            className="pointer-events-auto animate-[reward-in_0.25s_ease-out] rounded-xl border border-violet-500/40 bg-slate-900/95 px-4 py-3 shadow-lg shadow-violet-900/30 backdrop-blur"
          >
            <p className="text-sm font-semibold text-violet-300">+{event.xpGained} XP 획득!</p>
            {event.leveledUp && (
              <p className="text-sm font-bold text-amber-300 mt-0.5">🎉 레벨 업! Lv.{event.newLevel}</p>
            )}
            {event.newBadges.map((badge) => (
              <p key={badge.code} className="text-sm text-emerald-300 mt-0.5">
                {badge.icon} 뱃지 획득: {badge.name}
              </p>
            ))}
          </div>
        ))}
      </div>
    </RewardToastContext.Provider>
  );
}
