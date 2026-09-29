import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successfulResponse));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts the mobile result sheet half open so the map and results are visible", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="test" />);

    expect(container.querySelector(".mobile-market-sheet")).toHaveAttribute("data-snap", "half");
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
    expect(container.querySelector(".mobile-market-sheet")).toHaveAttribute("data-snap", "collapsed");
    await user.click(within(navigation).getByRole("button", { name: "목록" }));
    expect(container.querySelector(".mobile-market-sheet")).toHaveAttribute("data-snap", "full");
    await user.click(within(navigation).getByRole("button", { name: "검색" }));
    expect(screen.getByRole("searchbox", { name: "시장명 또는 지역 검색" })).toHaveFocus();
  });

  it("places mobile market results before visit guides", async () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" reviewedGuides={[{ id: "tongbok", name: "통복시장", schedule: "5·10일장", href: "/markets/tongbok" }]} />);

    const sheet = container.querySelector(".mobile-market-sheet-content") as HTMLElement;
    await within(sheet).findByRole("link", { name: /운천전통시장/ });
    const sheetText = sheet.textContent ?? "";
    expect(sheetText.indexOf("운천전통시장")).toBeLessThan(sheetText.indexOf("시장별 방문 정보"));
  });

  it("loads static markets and keeps the list usable when the map key is missing", async () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(max-width: 700px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    expect(screen.getByRole("heading", { level: 1, name: "오늘 장날" })).toBeInTheDocument();
    expect(screen.getByText("전국 5일장·전통시장 일정 지도")).toBeInTheDocument();
    expect((await screen.findAllByText("운천전통시장")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("4·9일장").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5·10일장").length).toBeGreaterThan(0);
    expect(screen.getByText("지도 없이도 시장을 찾을 수 있어요")).toBeInTheDocument();
    expect(within(container.querySelector(".mobile-market-results") as HTMLElement).getByText("지도를 사용할 수 없어 목록을 보여드려요.")).toBeInTheDocument();
    expect(container.querySelector(".mobile-market-sheet")).toHaveAttribute("data-snap", "full");
    expect(screen.getAllByText("2곳").length).toBeGreaterThan(0);
  });

  it("shows the actual seven-day range beside the result count", async () => {
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    expect(await screen.findByText("9/4–9/10")).toBeInTheDocument();
  });

  it("shows daily markets and omits directions when coordinates are missing", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?when=date&date=2026-09-03");
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.click(await screen.findByRole("link", { name: /제천중앙시장/ }));

    expect(screen.getByText("매일 운영")).toBeInTheDocument();
    expect(screen.getByText("오늘 운영")).toBeInTheDocument();
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
    const heading = within(screen.getByRole("complementary", { name: "시장 목록" }));
    expect(heading.getByText("검색된 시장")).toBeInTheDocument();
    expect(heading.getByText("날짜 조건 일치 0곳")).toBeInTheDocument();
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
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    await user.click(await screen.findByRole("link", { name: /통복시장/ }));
    fireEvent.change(screen.getByLabelText("방문 날짜 선택"), { target: { value: "2026-09-06" } });

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
    const sheet = container.querySelector(".mobile-market-sheet") as HTMLElement;
    const content = sheet.querySelector(".mobile-market-sheet-content") as HTMLElement;
    await within(sheet).findByRole("link", { name: /통복시장/ });
    content.scrollTop = 150;

    await user.click(within(sheet).getByRole("link", { name: /통복시장/ }));

    expect(sheet).toHaveClass("is-detail");
    expect(content.scrollTop).toBe(0);
  });

  it("shows unknown schedules only when the all-markets filter is selected", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    expect(screen.queryByText("일정미확인시장")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "전체" }));

    expect(screen.getByText("일정미확인시장")).toBeInTheDocument();
    expect(screen.getByText("4곳")).toBeInTheDocument();
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
    expect(screen.getByText("9월 5일 토요일")).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toContain("q=%ED%8F%89%ED%83%9D"));
    expect(window.location.search).toContain("market=tongbok");
  });

  it("links reviewed market titles to their canonical page in desktop and mobile details", async () => {
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
    expect(details).toHaveLength(2);
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
    expect(selectedDetails).toHaveLength(2);
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

    expect(screen.getByRole("link", { name: "불편 신고" })).toHaveAttribute("href", "/report?kind=service");
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

  it("closes the desktop detail after switching markets without reopening earlier selections", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?when=all");
    const { container } = render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);
    const list = container.querySelector<HTMLElement>(".list-pane");
    const detail = container.querySelector<HTMLElement>(".detail-pane");
    if (!list || !detail) throw new Error("Desktop panes were not rendered");

    await user.click(await within(list).findByRole("link", { name: /운천전통시장/ }));
    await user.click(within(list).getByRole("link", { name: /통복시장/ }));
    expect(within(detail).getByRole("article", { name: "통복시장 상세정보" })).toBeInTheDocument();
    await user.click(within(detail).getByRole("button", { name: "시장 상세 닫기" }));

    await waitFor(() => expect(within(detail).queryByRole("article")).not.toBeInTheDocument());
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

  it("홈 헤더에서 온누리상품권 사용처 허브로 연결한다", () => {
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    expect(screen.getByRole("link", { name: "온누리상품권" })).toHaveAttribute("href", "/onnuri");
  });
});
