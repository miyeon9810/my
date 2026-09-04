import { useAuth } from "@/contexts/AuthContext";
import { BADGE_CATALOG, BADGE_TIER_LABEL, type BadgeTier } from "@/lib/badges";

const TIER_STYLE: Record<BadgeTier, string> = {
  bronze: "ring-orange-500/40 bg-orange-500/10 text-orange-300",
  silver: "ring-slate-400/40 bg-slate-400/10 text-slate-300",
  gold: "ring-amber-400/40 bg-amber-400/10 text-amber-300",
  legendary: "ring-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300",
};

export function BadgeGrid() {
  const { profile } = useAuth();
  const earnedCodes = new Set(profile?.badgeCodes ?? []);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {BADGE_CATALOG.map((badge) => {
        const unlocked = earnedCodes.has(badge.code);
        return (
          <div
            key={badge.code}
            className={`rounded-xl border p-4 text-center transition ${
              unlocked ? "border-white/10 bg-slate-900/60" : "border-white/5 bg-slate-950/60 opacity-50"
            }`}
          >
            <div className="text-3xl">{unlocked ? badge.icon : "🔒"}</div>
            <p className="mt-2 text-sm font-medium text-slate-200">{badge.name}</p>
            <p className="mt-1 text-xs text-slate-500">{badge.description}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${TIER_STYLE[badge.tier]}`}
            >
              {BADGE_TIER_LABEL[badge.tier]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
