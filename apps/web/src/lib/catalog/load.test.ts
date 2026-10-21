import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CatalogSnapshot } from "./catalog";

const snapshots = vi.hoisted(() => ({ next: [] as (() => CatalogSnapshot)[] }));
vi.mock("./json-source", () => ({ loadJsonSnapshot: () => snapshots.next.shift()!() }));

const snapshot = (count: number): CatalogSnapshot => ({
  markets: Array.from({ length: count }, (_, index) => ({ id: `m${index}`, name: `시장${index}` }) as CatalogSnapshot["markets"][number]),
  editorial: [],
});
const HOUR = 60 * 60 * 1000;

describe("catalog cache", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    delete (globalThis as { __jangnalCatalog?: unknown }).__jangnalCatalog;
    snapshots.next = [];
  });
  afterEach(() => vi.useRealTimers());

  it("reads once and serves the same snapshot within an hour", async () => {
    const { loadCatalog } = await import("./load");
    snapshots.next.push(() => snapshot(1));

    const first = await loadCatalog();
    vi.advanceTimersByTime(HOUR - 1);

    expect(await loadCatalog()).toBe(first);
    expect(snapshots.next).toHaveLength(0);
  });

  it("refreshes after an hour and keeps the old snapshot when that fails", async () => {
    const { loadCatalog } = await import("./load");
    vi.spyOn(console, "error").mockImplementation(() => {});
    snapshots.next.push(() => snapshot(1), () => { throw new Error("db down"); }, () => snapshot(2));

    const first = await loadCatalog();
    vi.advanceTimersByTime(HOUR);
    expect(await loadCatalog()).toBe(first); // 뒤에서 다시 읽다가 실패
    await vi.runAllTimersAsync();
    expect((await loadCatalog()).markets).toHaveLength(1);

    await vi.runAllTimersAsync();
    expect((await loadCatalog()).markets).toHaveLength(2);
  });

  it("fails while nothing is cached yet", async () => {
    const { loadCatalog } = await import("./load");
    snapshots.next.push(() => { throw new Error("db down"); });

    await expect(loadCatalog()).rejects.toThrow("db down");
  });

  it("refreshCatalog replaces the snapshot right away", async () => {
    const { loadCatalog, refreshCatalog } = await import("./load");
    snapshots.next.push(() => snapshot(1), () => snapshot(3));

    await loadCatalog();
    await refreshCatalog();

    expect((await loadCatalog()).markets).toHaveLength(3);
  });
});
