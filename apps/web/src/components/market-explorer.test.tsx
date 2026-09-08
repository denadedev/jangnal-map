import { render, screen, waitFor, within } from "@testing-library/react";
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

  it("loads static markets and keeps the list usable when the map key is missing", async () => {
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    expect(screen.getByRole("heading", { level: 1, name: "오늘 장날" })).toBeInTheDocument();
    expect(screen.getByText("전국 5일장·전통시장 일정 지도")).toBeInTheDocument();
    expect(await screen.findByText("운천전통시장")).toBeInTheDocument();
    expect(screen.getByText("4·9일장")).toBeInTheDocument();
    expect(screen.getByText("5·10일장")).toBeInTheDocument();
    expect(screen.getByText("지도 없이도 시장을 찾을 수 있어요")).toBeInTheDocument();
    expect(screen.getByText("2곳")).toBeInTheDocument();
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
  });

  it("shows daily markets only in all and direct-date modes", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 4)} mapClientId="" />);

    expect(screen.queryByText("제천중앙시장")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "전체" }));
    expect(screen.getByText("제천중앙시장")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "오늘" }));
    expect(screen.queryByText("제천중앙시장")).not.toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: "통복시장" })).toBeInTheDocument();
    expect(screen.getByText("9월 5일 토요일")).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toContain("q=%ED%8F%89%ED%83%9D"));
    expect(window.location.search).toContain("market=tongbok");
  });

  it("shows seven days from today and marks every market day", async () => {
    const user = userEvent.setup();
    render(<MarketExplorer today={new Date(2026, 8, 3)} mapClientId="" />);

    await user.click(await screen.findByRole("link", { name: /운천전통시장/ }));
    const timeline = screen.getByRole("list", { name: "오늘부터 7일간 장날" });
    const dates = within(timeline).getAllByRole("listitem");

    expect(dates).toHaveLength(7);
    expect(dates[0]).toHaveTextContent("3");
    expect(dates[0]).toHaveTextContent("오늘");
    expect(dates[1]).toHaveTextContent("4");
    expect(dates[1]).toHaveTextContent("장날");
    expect(dates[6]).toHaveTextContent("9");
    expect(dates[6]).toHaveTextContent("장날");
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
});
