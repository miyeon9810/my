export const WEEKDAY_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export const WEEKDAY_LABEL_KO: Record<WeekdayCode, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

const STORE_TIME_ZONE = "Asia/Seoul";

// en-US short weekday names map 1:1 onto WEEKDAY_CODES.
const EN_SHORT_TO_CODE: Record<string, WeekdayCode> = {
  Mon: "MON",
  Tue: "TUE",
  Wed: "WED",
  Thu: "THU",
  Fri: "FRI",
  Sat: "SAT",
  Sun: "SUN",
};

function seoulParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    weekday: EN_SHORT_TO_CODE[parts.weekday],
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

/** Today's date, as YYYY-MM-DD in the store's local (Asia/Seoul) calendar day. */
export function todayDateKey(date: Date = new Date()): string {
  return seoulParts(date).dateKey;
}

/** Today's weekday code (MON..SUN), in the store's local (Asia/Seoul) calendar day. */
export function todayWeekdayCode(date: Date = new Date()): WeekdayCode {
  return seoulParts(date).weekday;
}

export function parseDayCodes(value: string): WeekdayCode[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is WeekdayCode => (WEEKDAY_CODES as readonly string[]).includes(v));
}

export function formatDayCodesKo(value: string): string {
  const codes = parseDayCodes(value);
  if (codes.length === 0) return "-";
  return codes.map((c) => WEEKDAY_LABEL_KO[c]).join("/");
}
