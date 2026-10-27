import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { publicMarkets } from "../lib/market-catalog";
import { findNearbyMarkets, MapParticipateButton, StoryListCard, TodayHighlightPrompt } from "./today-highlight-prompt";

const base = publicMarkets.find((market) => market.schedule.kind === "digit-pair")!;
const make = (id: string, name: string, days: [number, number], roadAddress: string): PublicMarket =>
  ({ ...base, id, name, roadAddress, schedule: { kind: "digit-pair", days } });
const markets = [
  make("a", "정선아리랑시장", [2, 7], "강원특별자치도 정선군 정선읍 1"),
  make("b", "정선 임계시장", [5, 10], "강원특별자치도 정선군 임계면 2"),
  make("c", "원주풍물시장", [2, 7], "강원특별자치도 원주시 3"),
  { ...make("d", "상설시장", [2, 7], "강원특별자치도 정선군 4"), schedule: { kind: "daily" as const } },
];
const today = new Date(2026, 9, 22);
const umami = { track: vi.fn() };

beforeEach(() => {
  (window as unknown as { umami: typeof umami }).umami = umami;
  umami.track.mockClear();
  window.localStorage.clear();
});

describe("TodayHighlightPrompt", () => {
  it("lets a visitor pick today's market and write about it", async () => {
    render(<TodayHighlightPrompt markets={markets} today={today} currentLocation={null} />);
    await userEvent.click(screen.getByRole("button", { name: "알려 주기" }));

    const picker = screen.getByRole("dialog", { name: "어느 장이었나요?" });
    expect(within(picker).getByText(/오늘 열린 장 2곳/)).toBeInTheDocument();
    expect(within(picker).queryByText("상설시장")).not.toBeInTheDocument();
    await userEvent.type(within(picker).getByRole("searchbox"), "원주");
    expect(within(picker).queryByText("정선아리랑시장")).not.toBeInTheDocument();
    await userEvent.click(within(picker).getByRole("button", { name: /원주풍물시장/ }));

    const sheet = screen.getByRole("dialog", { name: "이 장에 대해 알려 주기" });
    expect(within(sheet).getByText("원주풍물시장")).toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "map_today" });

    await userEvent.click(within(sheet).getByRole("button", { name: "바꾸기" }));
    expect(screen.getByRole("dialog", { name: "어느 장이었나요?" })).toBeInTheDocument();
  });

  it("stays hidden for the rest of the day once dismissed", async () => {
    const { unmount } = render(<TodayHighlightPrompt markets={markets} today={today} currentLocation={null} />);
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByText("오늘 열린 장 다녀오셨나요?")).not.toBeInTheDocument();
    unmount();

    render(<TodayHighlightPrompt markets={markets} today={today} currentLocation={null} />);
    expect(screen.queryByText("오늘 열린 장 다녀오셨나요?")).not.toBeInTheDocument();
    render(<TodayHighlightPrompt markets={markets} today={new Date(2026, 9, 27)} currentLocation={null} />);
    expect(screen.getByText("오늘 열린 장 다녀오셨나요?")).toBeInTheDocument();
  });

  it("does not show on days without a five-day market", () => {
    const { container } = render(<TodayHighlightPrompt markets={markets} today={new Date(2026, 9, 24)} currentLocation={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("StoryListCard", () => {
  const story = (marketId: string, name: string, day: number) =>
    ({ marketId, name, description: `${name} 설명`, category: "food" as const, createdAt: `2026-10-${day}T00:00:00.000Z` });
  const props = { markets, today, currentLocation: null, title: "오늘 서는 장 이야기", filter: "today" };

  it("shows the three newest stories of the listed markets and opens one", async () => {
    const onOpenStory = vi.fn();
    const stories = [story("a", "콧등치기국수", 21), story("c", "순대국", 20), story("a", "곤드레", 19)];
    render(<StoryListCard {...props} stories={stories} onOpenStory={onOpenStory} />);
    const card = screen.getByRole("group", { name: "오늘 서는 장 이야기" });
    expect(within(card).getAllByRole("listitem")).toHaveLength(3);
    expect(within(card).queryByRole("button", { name: /더 보기/ })).not.toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("story_list_view", { filter: "today", count: "3" });

    await userEvent.click(within(card).getByRole("button", { name: /원주풍물시장 순대국/ }));
    expect(onOpenStory).toHaveBeenCalledWith({ highlight: stories[1], market: markets[2] });
    expect(umami.track).toHaveBeenCalledWith("story_list_open", { filter: "today" });
  });

  it("moves the rest into a sheet that also leads to writing", async () => {
    const stories = Array.from({ length: 25 }, (_, index) => story("a", `이야기${index + 1}`, 1 + (index % 20)));
    render(<StoryListCard {...props} stories={stories} onOpenStory={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "이야기 22개 더 보기" }));

    const sheet = screen.getByRole("dialog", { name: "오늘 서는 장 이야기 25" });
    expect(within(sheet).getAllByRole("button", { name: /정선아리랑시장 이야기/ })).toHaveLength(20);
    await userEvent.click(within(sheet).getByRole("button", { name: "더 보기" }));
    expect(within(sheet).getAllByRole("button", { name: /정선아리랑시장 이야기/ })).toHaveLength(25);

    await userEvent.click(within(sheet).getByRole("button", { name: "나도 알려 주기" }));
    expect(screen.getByRole("dialog", { name: "어느 장이었나요?" })).toBeInTheDocument();
  });

  it("falls back to the today card when the listed markets have no stories", () => {
    render(<StoryListCard {...props} stories={[]} onOpenStory={vi.fn()} />);
    expect(screen.getByText("오늘 열린 장 다녀오셨나요?")).toBeInTheDocument();
  });

  it("stays hidden for the rest of the day once dismissed", async () => {
    render(<StoryListCard {...props} stories={[story("a", "곤드레", 21)]} onOpenStory={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("group", { name: "오늘 서는 장 이야기" })).not.toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("story_list_dismiss", { filter: "today" });
  });

  it("still shows stories after the today card was dismissed", async () => {
    const { unmount } = render(<TodayHighlightPrompt markets={markets} today={today} currentLocation={null} />);
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    unmount();

    render(<StoryListCard {...props} stories={[story("a", "곤드레", 21)]} onOpenStory={vi.fn()} />);
    expect(screen.getByRole("group", { name: "오늘 서는 장 이야기" })).toBeInTheDocument();
  });
});

describe("MapParticipateButton", () => {
  it("asks about today's market and still finds other markets by search", async () => {
    render(<MapParticipateButton markets={markets} today={today} currentLocation={null} />);
    await userEvent.click(screen.getByRole("button", { name: "오늘 장 꿀팁 한 줄 남기기" }));
    expect(umami.track).toHaveBeenCalledWith("highlight_map_button_open", { today: "yes" });

    const picker = screen.getByRole("dialog", { name: "어느 장이었나요?" });
    expect(within(picker).queryByText("정선 임계시장")).not.toBeInTheDocument();
    await userEvent.type(within(picker).getByRole("searchbox"), "정선");
    const rows = within(picker).getAllByRole("button", { name: /정선/ }).map((row) => row.textContent);
    expect(rows[0]).toContain("정선아리랑시장");
    expect(rows[0]).toContain("오늘 열림");
    expect(rows.some((row) => row?.includes("정선 임계시장"))).toBe(true);

    await userEvent.click(within(picker).getByRole("button", { name: /정선 임계시장/ }));
    expect(within(screen.getByRole("dialog", { name: "이 장에 대해 알려 주기" })).getByText("정선 임계시장")).toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "map_button" });
  });

  it("invites a story on days without a five-day market", async () => {
    render(<MapParticipateButton markets={markets} today={new Date(2026, 9, 24)} currentLocation={null} />);
    await userEvent.click(screen.getByRole("button", { name: "단골 장 꿀팁 남기기" }));
    expect(screen.getByText("시장 이름이나 지역으로 찾아 주세요")).toBeInTheDocument();
  });

  it("lists the linked markets first and counts submissions as map_set", async () => {
    render(<MapParticipateButton markets={markets} today={today} currentLocation={null} suggested={{ markets: [markets[1]], label: "스레드에서 본 시장" }} />);
    await userEvent.click(screen.getByRole("button", { name: "오늘 장 꿀팁 한 줄 남기기" }));

    const picker = screen.getByRole("dialog", { name: "어느 장이었나요?" });
    expect(within(picker).getByText("스레드에서 본 시장 1곳 · 다른 장은 검색해 주세요")).toBeInTheDocument();
    expect(within(picker).queryByText("정선아리랑시장")).not.toBeInTheDocument();
    await userEvent.click(within(picker).getByRole("button", { name: /정선 임계시장/ }));
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "map_set" });
  });
});

describe("MarketPicker", () => {
  it("fits the sheet to the visible area when the keyboard opens", async () => {
    const visual = Object.assign(new EventTarget(), { offsetTop: 0, height: 800 });
    Object.defineProperty(window, "visualViewport", { value: visual, configurable: true });
    try {
      render(<MapParticipateButton markets={markets} today={today} currentLocation={null} />);
      await userEvent.click(screen.getByRole("button", { name: "오늘 장 꿀팁 한 줄 남기기" }));
      const overlay = screen.getByRole("dialog", { name: "어느 장이었나요?" }).parentElement!;
      expect(overlay.style.height).toBe("800px");

      visual.height = 420;
      visual.offsetTop = 120;
      act(() => { visual.dispatchEvent(new Event("resize")); });
      expect(overlay.style.height).toBe("420px");
      expect(overlay.style.top).toBe("120px");
    } finally {
      Reflect.deleteProperty(window, "visualViewport");
    }
  });
});

describe("findNearbyMarkets", () => {
  it("returns other markets in the same city or county", () => {
    expect(findNearbyMarkets(markets[0], markets).map((market) => market.name)).toEqual(["정선 임계시장", "상설시장"]);
  });
});

describe("MapParticipateButton latest story", () => {
  const story = { marketId: "c", name: "메밀전병", description: null, category: "food", createdAt: "2026-10-22T01:00:00.000Z" };
  const serve = (highlight: unknown) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ highlight }))));

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date("2026-10-22T09:00:00.000Z") });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("briefly shows the newest story, opens it on tap, then folds back", async () => {
    serve(story);
    const onOpenStory = vi.fn();
    render(<MapParticipateButton markets={markets} today={today} currentLocation={null} onOpenStory={onOpenStory} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });

    const button = screen.getByRole("button", { name: /새 이야기 · 원주풍물시장 “메밀전병”/ });
    expect(umami.track).toHaveBeenCalledWith("latest_story_view", { category: "food" });
    await userEvent.click(button);
    expect(onOpenStory).toHaveBeenCalledWith(expect.objectContaining({ highlight: story, market: markets[2] }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => { await vi.advanceTimersByTimeAsync(4800); });
    expect(screen.getByRole("button", { name: "오늘 장 꿀팁 한 줄 남기기" })).toBeInTheDocument();
  });

  it("does not show the story again when the map redraws within the same visit", async () => {
    serve({ ...story, name: "수수부꾸미" });
    const { unmount } = render(<MapParticipateButton markets={markets} today={today} currentLocation={null} onOpenStory={vi.fn()} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    expect(screen.getByText(/수수부꾸미/)).toBeInTheDocument();
    unmount();

    render(<MapParticipateButton markets={markets} today={today} currentLocation={null} onOpenStory={vi.fn()} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    expect(screen.queryByText(/수수부꾸미/)).not.toBeInTheDocument();
  });

  it("skips stories older than seven days", async () => {
    serve({ ...story, createdAt: "2026-10-14T09:00:00.000Z" });
    render(<MapParticipateButton markets={markets} today={today} currentLocation={null} onOpenStory={vi.fn()} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    expect(screen.queryByText(/메밀전병/)).not.toBeInTheDocument();
  });
});
