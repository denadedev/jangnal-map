const koreaCalendarFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const koreaDateParts = (now: Date) => {
  const parts = Object.fromEntries(koreaCalendarFormatter.formatToParts(now).map(({ type, value }) => [type, value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
};

export function getKoreaCalendarDate(now: Date): Date {
  const { year, month, day } = koreaDateParts(now);
  return new Date(year, month - 1, day);
}

export function msUntilNextKoreaMidnight(now: Date): number {
  const { year, month, day } = koreaDateParts(now);
  return Math.max(1, Date.UTC(year, month - 1, day + 1) - 9 * 60 * 60 * 1000 - now.getTime());
}
