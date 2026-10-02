import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { MarketExplorer } from "./market-explorer";

const markets: PublicMarket[] = [
  {
    id: "uncheon",
    name: "운천전통시장",
    marketType: "상설장+4일장",
    roadAddress: "경기도 포천시 영북면 영북로 177번길 25",
    lotAddress: "경기도 포천시 영북면 운천리 513-15",
    latitude: 38.0899666,
    longitude: 127.2722253,
    scheduleRaw: "4일+9일",
    schedule: { kind: "digit-pair", days: [4, 9] },
    phone: "031-538-2200",
    hasParking: true,
    referenceDate: "2025-11-10",
    status: "운영",
    statusVerified: false,
    onnuri: {
      totalCount: 83,
      digitalCount: 71,
      paperCount: 65,
      referenceDate: "2025-07-31",
      source: {
        name: "소상공인시장진흥공단 전국 온누리상품권 가맹점 현황",
        url: "https://www.data.go.kr/data/3060079/fileData.do?recommendDataYn=Y",
      },
    },
    source: {
      name: "공공데이터포털 전국전통시장표준데이터",
      url: "https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y",
      referenceDate: "2025-11-10",
    },
  },
  {
    id: "tongbok",
    name: "통복시장",
    marketType: "상설장+5일장",
    roadAddress: "경기도 평택시 통복시장로25번길 10",
    lotAddress: "경기도 평택시 통복동 70-29",
    latitude: 36.99782533,
    longitude: 127.0850763,
    scheduleRaw: "5일+10일",
    schedule: { kind: "digit-pair", days: [5, 0] },
    phone: null,
    hasParking: false,
    referenceDate: "2025-11-10",
    status: "운영",
    statusVerified: false,
    onnuri: null,
    source: {
      name: "공공데이터포털 전국전통시장표준데이터",
      url: "https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y",
      referenceDate: "2025-11-10",
    },
  },
  {
    id: "daily-no-coordinates",
    name: "제천중앙시장",
    marketType: "상설장",
    roadAddress: "충청북도 제천시 풍양로 108",
    lotAddress: "충청북도 제천시 중앙로1가 77",
    latitude: null,
    longitude: null,
    scheduleRaw: "매일",
    schedule: { kind: "daily" },
    phone: "043-647-2047",
    hasParking: true,
    referenceDate: "2025-11-10",
    status: "운영",
    statusVerified: false,
    onnuri: null,
    source: {
      name: "공공데이터포털 전국전통시장표준데이터",
      url: "https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y",
      referenceDate: "2025-11-10",
    },
  },
  {
    id: "unknown",
    name: "일정미확인시장",
    marketType: "상설장",
    roadAddress: "충청북도 제천시 테스트로 1",
    lotAddress: null,
    latitude: 37.13,
    longitude: 128.2,
    scheduleRaw: "확인 중",
    schedule: { kind: "unknown", raw: "확인 중" },
    phone: null,
    hasParking: null,
    referenceDate: "2025-11-10",
    status: "운영",
    statusVerified: false,
    onnuri: null,
    source: {
      name: "공공데이터포털 전국전통시장표준데이터",
      url: "https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y",
      referenceDate: "2025-11-10",
    },
  },
];

const successfulResponse = {
  ok: true,
  json: async () => markets,
} as Response;

describe("MarketExplorer", () => {
  it("does not announce empty results while market data is pending", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<MarketExplorer today={new Date(2026, 9, 2)} />);

    const results = screen.getByRole("region", { name: "시장 결과" });
    expect(results).toHaveTextContent("시장 정보를 불러오는 중입니다.");
    expect(results).not.toHaveTextContent("0곳");
  });

  it("does not announce empty results when data loading fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<MarketExplorer today={new Date(2026, 9, 2)} />);

    const results = screen.getByRole("region", { name: "시장 결과" });
    await within(results).findByRole("button", { name: "다시 시도" });
    expect(results).not.toHaveTextContent("0곳");
  });

  it("returns to search after choosing the next visit date from an off-day market", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?when=date&date=2026-10-02");
    render(<MarketExplorer today={new Date(2026, 8, 30)} mapClientId="" />);
    await user.click(screen.getByRole("button", { name: "검색" }));
    const search = await screen.findByRole("dialog", { name: "시장 검색" });
    await user.type(within(search).getByRole("searchbox"), "통복시장");
    await user.click(await within(search).findByRole("button", { name: /^통복시장/ }));
    const detail = await screen.findByRole("article", { name: "통복시장 상세정보" });
    await user.click(within(detail).getByRole("button", { name: "다음 장날로 바꾸기" }));
    expect(within(detail).getByRole("region", { name: "선택한 방문 날짜" })).toHaveTextContent("2026년 10월 5일");
    expect(within(detail).getByText("이날 5일장이 열려요")).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog", { name: "통복시장 상세" })).getByRole("button", { name: "탐색으로 돌아가기" }));
    const restored = await screen.findByRole("dialog", { name: "시장 검색" });
    expect(within(restored).getByRole("searchbox")).toHaveValue("통복시장");
    expect(within(restored).getByLabelText("날짜 조건에 맞는 시장 수")).toHaveTextContent("1곳");
    const traverse = (direction: "back" | "forward") => act(async () => {
      await new Promise<void>((resolve) => {
        window.addEventListener("popstate", () => resolve(), { once: true });
        window.history[direction]();
      });
    });
    await traverse("forward");
    expect(screen.queryByRole("dialog", { name: "시장 검색" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "통복시장 상세" })).toBeInTheDocument();
    await traverse("back");
    expect(within(screen.getByRole("dialog", { name: "시장 검색" })).getByRole("searchbox")).toHaveValue("통복시장");
  });
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successfulResponse));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps mobile map and results in the page without a result sheet", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);
    await within(container.querySelector<HTMLElement>(".mobile-market-results")!).findByRole("link", { name: /운천전통시장/ });

    expect(container.querySelector(".mobile-market-sheet.is-results")).not.toBeInTheDocument();
    expect(container.querySelector(".explorer-grid")).toHaveAttribute("data-mobile-view", "map");
    const navigation = screen.getByRole("navigation", { name: "주요 화면" });
    await user.click(within(navigation).getByRole("button", { name: "목록" }));
    expect(container.querySelector(".explorer-grid")).toHaveAttribute("data-mobile-view", "list");
    await user.click(within(navigation).getByRole("button", { name: "지도" }));
    expect(container.querySelector(".explorer-grid")).toHaveAttribute("data-mobile-view", "map");
  });

  it("connects mobile map, list, and search controls around the discovery context", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    expect(screen.getByRole("heading", { level: 1, name: "오늘, 어디 장이 설까요?" })).toBeInTheDocument();
    expect(container.querySelector(".mobile-discovery-context")).toHaveTextContent("9/4–9/10");
    const navigation = screen.getByRole("navigation", { name: "주요 화면" });
    await user.click(within(navigation).getByRole("button", { name: "지도" }));
    expect(container.querySelector(".explorer-grid")).toHaveAttribute("data-mobile-view", "map");
    await user.click(within(navigation).getByRole("button", { name: "목록" }));
    expect(container.querySelector(".explorer-grid")).toHaveAttribute("data-mobile-view", "list");
    await user.click(within(navigation).getByRole("button", { name: "검색" }));
    expect(within(screen.getByRole("dialog", { name: "시장 검색" })).getByRole("searchbox", { name: "시장명 또는 지역 검색" })).toHaveFocus();
  });

  it("places mobile market results before visit guides", async () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" reviewedGuides={[{ id: "tongbok", name: "통복시장", schedule: "5·10일장", href: "/markets/tongbok" }]} />);

    const results = container.querySelector(".mobile-market-results") as HTMLElement;
    await within(results).findByRole("link", { name: /운천전통시장/ });
    const resultsText = results.textContent ?? "";
    expect(resultsText.indexOf("운천전통시장")).toBeLessThan(resultsText.indexOf("시장별 방문 정보"));
  });

  it("loads static markets and keeps the list usable when the map key is missing", async () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    expect(within(container.querySelector(".mobile-brand-row") as HTMLElement).getByRole("link", { name: "오늘 장날 홈" })).toBeInTheDocument();
    expect((await screen.findAllByText("운천전통시장")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("4·9일장").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5·10일장").length).toBeGreaterThan(0);
    expect(screen.getByText("지도 없이도 시장을 찾을 수 있어요")).toBeInTheDocument();
    expect(within(container.querySelector(".mobile-market-results") as HTMLElement).getByText("운천전통시장")).toBeInTheDocument();
    expect(container.querySelector(".explorer-grid")).toHaveAttribute("data-mobile-view", "map");
    expect(screen.getByRole("heading", { name: "조건에 맞는 시장 2곳" })).toBeInTheDocument();
  });

  it("shows the actual seven-day range beside the result count", async () => {
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    expect(screen.getByText("오늘, 어디 장이 설까요?").closest(".mobile-discovery-context")).toHaveTextContent("9/4–9/10");
  });

  it("shows daily markets and omits directions when coordinates are missing", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?when=date&date=2026-09-03");
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.click(await screen.findByRole("link", { name: /제천중앙시장/ }));

    expect(screen.getByText("상설시장")).toBeInTheDocument();
    expect(screen.queryByText("오늘 운영")).not.toBeInTheDocument();
    expect(screen.getByText(/점포별 영업일과 정기휴무/)).toBeInTheDocument();
    expect(screen.getAllByText("위치 확인 필요")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "NAVER 지도에서 길찾기" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "공유하기" }).closest(".detail-actions")).toHaveClass("share-only");
  });

  it("keeps the unsearched date view focused on market days while all mode includes daily markets", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    expect(screen.queryByText("제천중앙시장")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "전체" }));
    expect(screen.getByText("제천중앙시장")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "오늘" }));
    expect(screen.queryByText("제천중앙시장")).not.toBeInTheDocument();
  });

  it("keeps a named daily market findable under the default seven-day filter", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    await user.type(await screen.findByRole("searchbox", { name: "시장명 또는 지역 검색" }), "제천중앙시장");

    expect(screen.getByRole("link", { name: /제천중앙시장/ })).toBeInTheDocument();
    expect(screen.getByText("매일 운영 일정")).toBeInTheDocument();
  });

  it("keeps a matched five-day market visible when it has no market day on the chosen date", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?when=date&date=2026-09-06");
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    await user.type(await screen.findByRole("searchbox", { name: "시장명 또는 지역 검색" }), "통복시장");

    expect(screen.getByRole("link", { name: /통복시장/ })).toBeInTheDocument();
    expect(screen.getByText("이날은 5일장이 아니에요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "날짜 제한 해제" })).toBeInTheDocument();
    const results = within(screen.getByRole("region", { name: "시장 결과" }));
    expect(results.getByRole("heading", { name: "선택일에 장이 서는 시장 0곳" })).toBeInTheDocument();
  });

  it("keeps an unconfirmed schedule findable without claiming it is closed", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?when=date&date=2026-09-06");
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    await user.type(await screen.findByRole("searchbox", { name: "시장명 또는 지역 검색" }), "일정미확인시장");

    expect(screen.getByRole("link", { name: /일정미확인시장/ })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "다른 검색 결과" })).toHaveTextContent("운영 일정 확인 필요");
    expect(screen.getByRole("heading", { name: "날짜 조건에서 제외된 검색 결과" })).toBeInTheDocument();
  });

  it("shows the direct visit date in Korean detail after selecting a search result", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?when=date&date=2026-09-06");
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    await user.type(await screen.findByRole("searchbox", { name: "시장명 또는 지역 검색" }), "통복시장");
    await user.click(screen.getByRole("link", { name: /통복시장/ }));

    expect(screen.getByRole("region", { name: "선택한 방문 날짜" })).toHaveTextContent("이날은 5일장이 아니에요");
  });

  it("lets a visitor choose a date inside detail without losing the selected market", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?when=date&date=2026-09-05");
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    await user.click(await screen.findByRole("link", { name: /통복시장/ }));
    await user.click(screen.getByRole("button", { name: "방문 날짜 바꾸기" }));
    const picker = screen.getByRole("dialog", { name: "방문 날짜 선택" });
    await user.click(within(picker).getByRole("button", { name: "2026년 9월 6일" }));
    await user.click(within(picker).getByRole("button", { name: "이 날짜 적용" }));

    expect(screen.getByRole("article", { name: "통복시장 상세정보" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "선택한 방문 날짜" })).toHaveTextContent("이날은 5일장이 아니에요");
    await waitFor(() => expect(window.location.search).toContain("date=2026-09-06"));
  });

  it("opens mobile detail at the top after scrolling results", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);
    const results = container.querySelector(".mobile-market-results") as HTMLElement;
    const page = container.querySelector(".explorer-grid") as HTMLElement;
    await within(results).findByRole("link", { name: /통복시장/ });
    page.scrollTop = 150;

    await user.click(within(results).getByRole("link", { name: /통복시장/ }));

    expect(container.querySelector(".mobile-market-sheet")).toHaveClass("is-detail");
    expect(container.querySelector(".mobile-market-sheet-content")).toHaveProperty("scrollTop", 0);
  });

  it("shows unknown schedules only when the all-markets filter is selected", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    expect(screen.queryByText("일정미확인시장")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "전체" }));

    expect(screen.getByText("일정미확인시장")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "조건에 맞는 시장 4곳" })).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toContain("when=all"));
  });

  it("filters by region, selects a market, and preserves both values in the URL", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.type(await screen.findByRole("searchbox", { name: "시장명 또는 지역 검색" }), "평택");
    expect(screen.queryByText("운천전통시장")).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /통복시장/ }));

    const detail = screen.getByRole("article", { name: "통복시장 상세정보" });
    expect(within(detail).getByRole("heading", { name: "통복시장" })).toBeInTheDocument();
    expect(within(detail).queryByRole("link", { name: "통복시장" })).not.toBeInTheDocument();
    expect(detail).toHaveTextContent("9월 5일");
    await waitFor(() => expect(window.location.search).toContain("q=%ED%8F%89%ED%83%9D"));
    expect(window.location.search).toContain("market=tongbok");
  });

  it("links reviewed market titles to their canonical page in mobile details", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    render(
      <MarketExplorer
        today={new Date(2026, 8, 3)}
        mapClientId=""
        reviewedMarketIds={["tongbok"]}
      />,
    );

    await user.click((await screen.findAllByRole("link", { name: /통복시장/ }))[0]);

    const details = await screen.findAllByRole("article", { name: "통복시장 상세정보" });
    expect(details).toHaveLength(1);
    for (const detail of details) {
      expect(within(detail).getByRole("link", { name: "통복시장" })).toHaveAttribute(
        "href",
        "/markets/통복시장-tongbok",
      );
    }
  });

  it("shows current-month market days without a duplicate seven-day timeline", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.click((await screen.findAllByRole("link", { name: /운천전통시장/ }))[0]);
    const calendar = screen.getByRole("list", { name: "이달의 장날" });
    expect(calendar.querySelector('time[datetime="2026-09-04"]')?.parentElement).toHaveClass("is-market-day");
    expect(calendar.querySelector('time[datetime="2026-09-09"]')?.parentElement).toHaveClass("is-market-day");
    expect(screen.queryByRole("list", { name: "오늘부터 7일간 장날" })).not.toBeInTheDocument();
  });

  it("선택한 시장의 온누리상품권 가맹점 수를 보여준다", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.click((await screen.findAllByRole("link", { name: /운천전통시장/ }))[0]);

    expect(screen.getByRole("heading", { level: 3, name: "온누리상품권" })).toBeInTheDocument();
    expect(screen.getByText("가맹점 총 83곳")).toBeInTheDocument();
  });

  it("shows an actionable empty state when no market matches", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.type(await screen.findByRole("searchbox", { name: "시장명 또는 지역 검색" }), "없는지역");

    expect(screen.getByRole("heading", { name: "조건에 맞는 시장이 없어요" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "필터 초기화" })).toBeInTheDocument();
  });

  it("clears a selected market when a filter excludes it", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.click(await screen.findByRole("link", { name: /운천전통시장/ }));
    expect(screen.getByRole("heading", { name: "운천전통시장" })).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "시장명 또는 지역 검색" }), "평택");

    await waitFor(() => expect(screen.queryByRole("heading", { name: "운천전통시장" })).not.toBeInTheDocument());
    await waitFor(() => expect(window.location.search).not.toContain("market=uncheon"));
  });

  it("returns the mobile sheet to results when a filter excludes the selected market", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.click((await screen.findAllByRole("link", { name: /운천전통시장/ }))[0]);
    const selectedDetails = await screen.findAllByRole("article", { name: "운천전통시장 상세정보" });
    expect(selectedDetails).toHaveLength(1);
    for (const detail of selectedDetails) {
      expect(within(detail).queryByRole("link", { name: "운천전통시장" })).not.toBeInTheDocument();
    }
    await user.type(screen.getByRole("searchbox", { name: "시장명 또는 지역 검색" }), "평택");

    await waitFor(() => expect(screen.queryByRole("article", { name: /운천전통시장/ })).not.toBeInTheDocument());
    expect(within(screen.getByRole("region", { name: /시장 결과/ })).getByText("통복시장")).toBeInTheDocument();
  });

  it("restores search, date mode, and selected market from the URL", async () => {
    window.history.replaceState(null, "", "/?q=%ED%8F%89%ED%83%9D&when=today&market=tongbok");
    render(<MarketExplorer today={new Date(2026, 8, 5)} mapClientId="" />);

    expect(await screen.findByDisplayValue("평택")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "오늘" })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByRole("heading", { name: "통복시장" })).toBeInTheDocument();
  });

  it("links service feedback and the selected market to the unified report page", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("link", { name: "불편 신고" })).toHaveAttribute("href", "/report?kind=service");
    await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));
    await user.click(await screen.findByRole("link", { name: /운천전통시장/ }));
    expect(screen.getByRole("link", { name: "정보가 다른가요? 수정 제보" })).toHaveAttribute(
      "href",
      "/report?kind=market&market=uncheon",
    );
  });

  it("shows a share action for the selected market", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.click(await screen.findByRole("link", { name: /운천전통시장/ }));

    const shareAction = screen.getByRole("button", { name: "공유하기" });
    expect(shareAction).toBeInTheDocument();
    expect(shareAction).toHaveClass("market-action-secondary");
    expect(shareAction.className).not.toMatch(/share/i);
  });

  it("closes detail after switching markets without reopening earlier selections", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?when=all");
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);
    const results = container.querySelector<HTMLElement>(".mobile-market-results");
    if (!results) throw new Error("Market results were not rendered");

    await user.click(await within(results).findByRole("link", { name: /운천전통시장/ }));
    await user.click(screen.getByRole("button", { name: "탐색으로 돌아가기" }));
    await user.click(within(results).getByRole("link", { name: /통복시장/ }));
    expect(screen.getByRole("article", { name: "통복시장 상세정보" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "탐색으로 돌아가기" }));

    await waitFor(() => expect(screen.queryByRole("article")).not.toBeInTheDocument());
    expect(window.location.search).not.toContain("market=");
  });

  it("shares the selected Korean visit date even for a reviewed market", async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    window.history.replaceState(null, "", "/?q=%ED%86%B5%EB%B3%B5%EC%8B%9C%EC%9E%A5&when=date&date=2026-09-10");
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" reviewedMarketIds={["tongbok"]} />);

    await user.click(await screen.findByRole("link", { name: /통복시장/ }));
    await user.click(screen.getByRole("button", { name: "공유하기" }));

    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      text: "9월 10일 통복시장, 같이 갈래요?",
      url: "http://localhost:3000/?q=%ED%86%B5%EB%B3%B5%EC%8B%9C%EC%9E%A5&when=date&date=2026-09-10&market=tongbok",
    }));
  });

  it("keeps the selected visit date in a result opened in another tab", async () => {
    window.history.replaceState(null, "", "/?q=%ED%86%B5%EB%B3%B5%EC%8B%9C%EC%9E%A5&when=date&date=2026-09-10");
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" reviewedMarketIds={["tongbok"]} />);

    expect(await screen.findByRole("link", { name: /통복시장/ })).toHaveAttribute(
      "href",
      "/?q=%ED%86%B5%EB%B3%B5%EC%8B%9C%EC%9E%A5&when=date&date=2026-09-10&market=tongbok",
    );
  });

  it("홈 메뉴에서 온누리상품권 사용처 허브로 연결한다", async () => {
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await userEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("link", { name: "온누리상품권" })).toHaveAttribute("href", "/onnuri");
  });
});
