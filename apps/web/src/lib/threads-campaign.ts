const campaignPattern = /^(\d{4})(\d{2})(\d{2})(0830|2030)$/;

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

export function parseThreadsCampaign(search: string): string | null {
  const params = new URLSearchParams(search);
  if (params.getAll("when").length !== 1 || params.get("when") !== "date") return null;
  if (params.getAll("date").length !== 1) return null;
  if (params.getAll("utm_source").length !== 1 || params.get("utm_source") !== "threads") return null;
  if (params.getAll("utm_campaign").length !== 1) return null;

  const code = params.get("utm_campaign") ?? "";
  const match = campaignPattern.exec(code);
  if (!match) return null;

  const [, year, month, day, slot] = match;
  const runDate = `${year}-${month}-${day}`;
  const parsedDate = new Date(`${runDate}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || isoDate(parsedDate) !== runDate) return null;
  if (slot === "2030" && parsedDate.getUTCDay() === 0) return null;

  const targetDate = new Date(parsedDate.getTime() + (slot === "2030" ? 86_400_000 : 0));
  return params.get("date") === isoDate(targetDate) ? code : null;
}

type UmamiWindow = Window & { umami?: { track: (name: string, data: { campaign: string }) => void } };

export function startThreadsEntryTracking(code: string, onTracked?: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const analyticsWindow = window as UmamiWindow;
  let timer: number | null = null;
  let attempts = 0;
  let finished = false;
  const stop = () => {
    finished = true;
    if (timer !== null) window.clearInterval(timer);
  };
  const tryTrack = () => {
    if (finished) return;
    attempts++;
    if (typeof analyticsWindow.umami?.track === "function") {
      try {
        analyticsWindow.umami.track("threads_entry", { campaign: code });
        onTracked?.();
        stop();
        return;
      } catch {
        // Analytics must never block market browsing.
      }
    }
    if (attempts >= 40) stop();
  };
  tryTrack();
  if (!finished) timer = window.setInterval(tryTrack, 100);
  return stop;
}
