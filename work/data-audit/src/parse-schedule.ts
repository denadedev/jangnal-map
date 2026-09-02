export type ParsedSchedule =
  | { kind: "daily" }
  | { kind: "digit-pair"; days: [number, number] }
  | { kind: "unknown"; raw: string };

const digitPairPattern = /^(?:매월\s*)?(\d{1,2})일?\s*[+·,/]\s*(\d{1,2})일?(?:장)?$/;

export function parseSchedule(input: string | null): ParsedSchedule {
  const raw = input?.trim() ?? "";
  if (raw === "매일") return { kind: "daily" };

  const match = raw.match(digitPairPattern);
  if (!match?.[1] || !match[2]) return { kind: "unknown", raw };

  const first = Number(match[1]);
  const second = Number(match[2]);
  const isCalendarDay = (day: number): boolean => day >= 1 && day <= 31;

  if (!isCalendarDay(first) || !isCalendarDay(second) || second - first !== 5) {
    return { kind: "unknown", raw };
  }

  return { kind: "digit-pair", days: [first, second] };
}
