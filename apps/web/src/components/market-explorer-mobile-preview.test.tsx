import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { MarketExplorer } from "./market-explorer";
import { useEffect } from "react";

type MockMapProps = {
  markets: PublicMarket[];
  selectedId: string | null;
  onSelect: (market: PublicMarket) => void;
  onStatusChange?: (status: "idle" | "loading" | "ready" | "error") => void;
  onCameraRestoreComplete?: (restored: boolean) => void;
};

vi.mock("./market-map", () => ({
  MarketMap: ({ markets, selectedId, onSelect, onStatusChange, onCameraRestoreComplete }: MockMapProps) => {
    useEffect(() => {
      if (selectedId === null) onCameraRestoreComplete?.(true);
    }, [onCameraRestoreComplete, selectedId]);
    return (
      <button
        type="button"
        aria-label="지도에서 첫 시장 선택"
        onClick={() => {
          onStatusChange?.("ready");
          if (markets[0]) onSelect(markets[0]);
        }}
      >
        지도에서 선택
      </button>
    );
  },
}));

const market: PublicMarket = {
  id: "map-preview-market",
  name: "지도선택시장",
  marketType: "5일장",
  roadAddress: "서울특별시 중구 시장길 1",
  lotAddress: null,
  latitude: 37.5,
  longitude: 127,
  scheduleRaw: "5일+10일",
  schedule: { kind: "digit-pair", days: [5, 0] },
  phone: null,
  hasParking: null,
  referenceDate: "2026-09-01",
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source: { name: "출처", url: "https://example.com", referenceDate: "2026-09-01" },
};

const mobileMedia = (matches: boolean) => vi.fn((query: string) => ({
  matches: query === "(max-width: 700px)" ? matches : false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

describe("MarketExplorer map-origin selection", () => {
  let visualViewportDescriptor: PropertyDescriptor | undefined;
  beforeEach(() => {
    visualViewportDescriptor = Object.getOwnPropertyDescriptor(window, "visualViewport");
    window.history.replaceState(null, "", "/");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [market] }));
    vi.stubGlobal("matchMedia", mobileMedia(true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (visualViewportDescriptor) Object.defineProperty(window, "visualViewport", visualViewportDescriptor);
    else Reflect.deleteProperty(window, "visualViewport");
  });

  it("opens a map selection in preview, then replaces it with the full detail view", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 4)} />);

    await user.click(await screen.findByRole("button", { name: "지도에서 첫 시장 선택" }));
    const sheet = document.querySelector(".mobile-market-sheet");
    await waitFor(() => expect(sheet).toHaveClass("is-preview"));
    expect(sheet).toHaveAttribute("data-snap", "collapsed");
    expect(screen.getByRole("article", { name: "지도선택시장 미리보기" })).toBeVisible();
    expect(window.history.state.mobileMarketView).toBe("preview");

    await user.click(screen.getByRole("button", { name: "상세 보기" }));
    await waitFor(() => expect(sheet).toHaveClass("is-detail"));
    expect(sheet).toHaveAttribute("data-snap", "full");
    expect(sheet).toHaveAttribute("aria-modal", "true");
    expect(window.history.state.mobileMarketView).toBe("detail");
  });

  it("still renders the map-origin detail path when matchMedia is unavailable", async () => {
    vi.stubGlobal("matchMedia", undefined);
    render(<MarketExplorer today={new Date(2026, 8, 4)} />);

    await userEvent.click(await screen.findByRole("button", { name: "지도에서 첫 시장 선택" }));
    await waitFor(() => expect(window.history.state.mobileMarketView).toBe("detail"));
    expect(screen.getByRole("article", { name: "지도선택시장 상세정보" })).toBeInTheDocument();
    expect(document.querySelector(".mobile-market-sheet")).not.toBeInTheDocument();
  });

  it("restores the prior result snap when Back closes a preview and Forward reopens it", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 4)} />);

    await user.click(await screen.findByRole("button", { name: "목록 열기" }));
    await user.click(screen.getByRole("button", { name: "지도에서 첫 시장 선택" }));
    const sheet = document.querySelector(".mobile-market-sheet");
    await waitFor(() => expect(sheet).toHaveClass("is-preview"));
    expect(window.history.state.mobileMarketSource).toBe("map");
    expect(window.history.state.mobileReturnSnap).toBe("half");

    const traverse = (direction: "back" | "forward") => act(async () => {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error(`No popstate after history.${direction}()`)), 1_000);
        window.addEventListener("popstate", () => {
          window.clearTimeout(timeout);
          resolve();
        }, { once: true });
        window.history[direction]();
      });
    });

    await traverse("back");
    await waitFor(() => expect(sheet).toHaveClass("is-results"));
    expect(sheet).toHaveAttribute("data-snap", "half");
    expect(window.location.search).not.toContain("market=");

    await traverse("forward");
    await waitFor(() => expect(sheet).toHaveClass("is-preview"));
    expect(sheet).toHaveAttribute("data-snap", "collapsed");
    expect(window.history.state.mobileMarketSource).toBe("map");
    expect(window.history.state.mobileReturnSnap).toBe("half");
  });

  it("expands results for a smaller visual viewport and restores the prior preview after blur", async () => {
    const user = userEvent.setup();
    const viewport = Object.assign(new EventTarget(), { height: window.innerHeight, offsetTop: 0 }) as EventTarget & {
      height: number;
      offsetTop: number;
    };
    Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
    render(<MarketExplorer today={new Date(2026, 8, 4)} />);
    const sheet = document.querySelector(".mobile-market-sheet");
    const search = await screen.findByRole("searchbox", { name: "시장명 또는 지역 검색" });

    search.focus();
    viewport.height = 480;
    viewport.dispatchEvent(new Event("resize"));
    await waitFor(() => expect(document.querySelector(".explorer-grid")).toHaveAttribute("data-keyboard-open", "true"));
    await waitFor(() => expect(sheet).toHaveAttribute("data-snap", "full"));

    fireEvent.blur(search);
    await waitFor(() => expect(sheet).toHaveAttribute("data-snap", "collapsed"));
    await waitFor(() => expect(document.querySelector(".explorer-grid")).toHaveAttribute("data-keyboard-open", "false"));

    viewport.height = window.innerHeight;
    viewport.dispatchEvent(new Event("resize"));
    await user.click(screen.getByRole("button", { name: "지도에서 첫 시장 선택" }));
    await waitFor(() => expect(sheet).toHaveClass("is-preview"));

    search.focus();
    viewport.height = 480;
    viewport.dispatchEvent(new Event("resize"));
    await waitFor(() => expect(sheet).toHaveClass("is-results"));
    await waitFor(() => expect(sheet).toHaveAttribute("data-snap", "full"));

    fireEvent.blur(search);
    await waitFor(() => expect(sheet).toHaveClass("is-preview"));
    expect(sheet).toHaveAttribute("data-snap", "collapsed");
  });

  it("recovers from a transient market data error when the user retries", async () => {
    const fetchMock = vi.fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new Error("temporary network failure"))
      .mockResolvedValueOnce({ ok: true, json: async () => [market] } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 5)} mapClientId="" />);

    expect(await screen.findAllByRole("heading", { name: "시장 정보를 불러오지 못했어요" })).toHaveLength(2);
    const mobileSheet = document.querySelector<HTMLElement>(".mobile-market-sheet");
    if (!mobileSheet) throw new Error("Mobile market sheet was not rendered");
    await user.click(within(mobileSheet).getByRole("button", { name: "다시 시도" }));
    expect(await within(mobileSheet).findByText("지도선택시장")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
