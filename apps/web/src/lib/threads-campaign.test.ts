import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parseThreadsCampaign, startThreadsEntryTracking } from "./threads-campaign";

const url = (date: string, code: string) =>
  `?when=date&date=${date}&utm_source=threads&utm_campaign=${code}`;

describe("Threads campaign attribution", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    delete (window as typeof window & { umami?: unknown }).umami;
    vi.useRealTimers();
  });

  it("accepts an eligible morning slot and a next-day evening slot", () => {
    expect(parseThreadsCampaign(url("2026-09-28", "202609280830"))).toBe("202609280830");
    expect(parseThreadsCampaign(url("2026-09-29", "202609282030"))).toBe("202609282030");
    expect(parseThreadsCampaign(url("2026-10-01", "202609302030"))).toBe("202609302030");
  });

  it.each([
    ["", "missing campaign"],
    ["?when=date&date=2026-09-28&utm_source=other&utm_campaign=202609280830", "wrong source"],
    [url("2026-09-29", "202609280830"), "target date mismatch"],
    [url("2026-09-28", "202609272030"), "Sunday evening is not scheduled"],
    [url("2026-02-30", "202602300830"), "invalid calendar date"],
    [url("2026-09-28", "bad-code"), "malformed code"],
    [url("2026-09-28", "202609280830") + "&utm_campaign=202609280830", "duplicate campaign"],
    [url("2026-09-28", "202609280830") + "&utm_source=threads", "duplicate source"],
  ])("ignores %s: %s", (search) => {
    expect(parseThreadsCampaign(search)).toBeNull();
  });

  it("tracks a valid campaign once without sending the URL or search terms", () => {
    const track = vi.fn();
    Object.assign(window, { umami: { track } });

    const stop = startThreadsEntryTracking("202609280830");
    vi.advanceTimersByTime(5_000);

    expect(track).toHaveBeenCalledExactlyOnceWith("threads_entry", { campaign: "202609280830" });
    stop();
  });

  it("waits briefly for Umami and gives up quietly when it is blocked", () => {
    const track = vi.fn();
    const stop = startThreadsEntryTracking("202609280830");
    vi.advanceTimersByTime(200);
    Object.assign(window, { umami: { track } });
    vi.advanceTimersByTime(300);
    expect(track).toHaveBeenCalledExactlyOnceWith("threads_entry", { campaign: "202609280830" });
    stop();

    delete (window as typeof window & { umami?: unknown }).umami;
    expect(() => vi.advanceTimersByTime(5_000)).not.toThrow();
  });

  it("stops trying after the analytics script stays unavailable", () => {
    const track = vi.fn();

    startThreadsEntryTracking("202609280830");
    vi.advanceTimersByTime(4_000);
    Object.assign(window, { umami: { track } });
    vi.advanceTimersByTime(1_000);

    expect(track).not.toHaveBeenCalled();
  });

  it("cancels pending tracking when the page is left before Umami loads", () => {
    const track = vi.fn();
    const stop = startThreadsEntryTracking("202609280830");

    stop();
    Object.assign(window, { umami: { track } });
    vi.advanceTimersByTime(5_000);

    expect(track).not.toHaveBeenCalled();
  });

  it("retries a failed analytics call and records the arrival only once", () => {
    const track = vi.fn()
      .mockImplementationOnce(() => { throw new Error("analytics temporarily unavailable"); });
    const onTracked = vi.fn();
    Object.assign(window, { umami: { track } });

    startThreadsEntryTracking("202609280830", onTracked);
    vi.advanceTimersByTime(5_000);

    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenLastCalledWith("threads_entry", { campaign: "202609280830" });
    expect(onTracked).toHaveBeenCalledOnce();
  });
});
