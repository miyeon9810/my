// Pure badge catalog data — safe to import from client components.
// Unlock logic (which needs Prisma) lives in `lib/achievements.ts`.

export type BadgeTier = "bronze" | "silver" | "gold" | "legendary";

export type BadgeDefinition = {
  code: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
};

export const BADGE_CATALOG: BadgeDefinition[] = [
  { code: "first_quest", name: "첫 발걸음", description: "퀘스트를 처음으로 완료했다", icon: "🌱", tier: "bronze" },
  { code: "quest_10", name: "퀘스트 헌터", description: "퀘스트 10개 완료", icon: "🗡️", tier: "bronze" },
  { code: "quest_50", name: "퀘스트 마스터", description: "퀘스트 50개 완료", icon: "⚔️", tier: "silver" },
  { code: "quest_100", name: "퀘스트 레전드", description: "퀘스트 100개 완료", icon: "🏆", tier: "gold" },
  { code: "epic_quest", name: "에픽 클리어", description: "에픽 난이도 퀘스트 완료", icon: "💎", tier: "silver" },
  { code: "streak_3", name: "불씨", description: "3일 연속 퀘스트 완료", icon: "🔥", tier: "bronze" },
  { code: "streak_7", name: "타오르는 열정", description: "7일 연속 퀘스트 완료", icon: "🔥", tier: "silver" },
  { code: "streak_30", name: "꺼지지 않는 불꽃", description: "30일 연속 퀘스트 완료", icon: "🔥", tier: "legendary" },
  { code: "focus_1h", name: "집중의 시작", description: "누적 집중 시간 1시간 달성", icon: "⏱️", tier: "bronze" },
  { code: "focus_10h", name: "몰입러", description: "누적 집중 시간 10시간 달성", icon: "⏳", tier: "silver" },
  { code: "focus_100h", name: "그라인더", description: "누적 집중 시간 100시간 달성", icon: "🕰️", tier: "gold" },
  { code: "level_5", name: "레벨 5", description: "캐릭터 레벨 5 달성", icon: "⭐", tier: "bronze" },
  { code: "level_10", name: "레벨 10", description: "캐릭터 레벨 10 달성", icon: "🌟", tier: "silver" },
  { code: "level_25", name: "레벨 25", description: "캐릭터 레벨 25 달성", icon: "✨", tier: "gold" },
  { code: "party_join", name: "파티 결성", description: "첫 파티에 합류했다", icon: "🤝", tier: "bronze" },
  { code: "party_create", name: "파티 리더", description: "직접 파티를 만들었다", icon: "🚩", tier: "bronze" },
  { code: "clan_join", name: "클랜원", description: "첫 클랜에 합류했다", icon: "🛡️", tier: "bronze" },
  { code: "clan_create", name: "클랜 마스터", description: "직접 클랜을 만들었다", icon: "🏰", tier: "silver" },
];

export const BADGE_TIER_LABEL: Record<BadgeTier, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  legendary: "레전더리",
};
