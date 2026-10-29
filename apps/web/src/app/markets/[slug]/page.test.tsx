import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createCatalog } from "../../../lib/catalog/catalog";
import { loadJsonSnapshot } from "../../../lib/catalog/json-source";
import { createMarketSlug, SITE_URL } from "../../../lib/market-seo";
import MarketPage, { generateMetadata } from "./page";

const { markets: publicMarkets, reviewedMarkets, findRelatedMarkets, isMarketIndexable } = createCatalog(loadJsonSnapshot());

describe("market detail route", () => {
  it("publishes the corrected Seogwipo dates and their separate source", async () => {
    render(await MarketPage({ params: Promise.resolve({ slug: "서귀포향토오일시장-2adc6a0b" }) }));
    expect(screen.getByText("서귀포향토오일시장 장날은 매월 4일·9일·14일·19일·24일·29일입니다.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "장날 정정 근거" })).toHaveTextContent("제주관광공사");
  });

  it("publishes a page for every reviewed public market", async () => {
    const slugs = publicMarkets.filter(isMarketIndexable).map(createMarketSlug);

    expect(slugs).toHaveLength(65);
    expect(new Set(slugs)).toHaveLength(65);
    expect(slugs).toContain("용인중앙시장-389b4a24");
    await expect(MarketPage({ params: Promise.resolve({ slug: "없는-시장-00000000" }) })).rejects.toThrow();
  });

  it("returns canonical schedule metadata without an exact date", async () => {
    const market = reviewedMarkets.find((item) => item.schedule.kind === "digit-pair")!;
    const slug = createMarketSlug(market);

    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });

    expect(metadata.title).toContain("장날 날짜");
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/markets/${slug}`);
    expect(metadata.openGraph?.url).toBe(`${SITE_URL}/markets/${slug}`);
    expect(metadata.openGraph?.images).toEqual([expect.objectContaining({ url: "/og-image.png", width: 1200, height: 630 })]);
    expect(metadata.description).toContain("장날은 매월");
  });

  it("marks unknown schedules as noindex", async () => {
    const market = publicMarkets.find((item) => item.schedule.kind === "unknown")!;

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: createMarketSlug(market) }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("offers one map action with a provider choice", async () => {
    const market = reviewedMarkets[0];

    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    await userEvent.click(screen.getByRole("button", { name: "지도·길찾기" }));
    expect(screen.getByRole("link", { name: "NAVER 지도 — 길찾기" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "카카오맵 — 길찾기" })).toBeInTheDocument();
  });

  it("renders a selected-map button for a valid market without crawlable map query links", async () => {
    const market = reviewedMarkets.find((item) => item.schedule.kind === "digit-pair")!;

    const { container } = render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    expect(screen.getByRole("heading", { name: new RegExp(`${market.name} 장날 날짜`) })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "장날 날짜" })).toBeInTheDocument();
    expect(screen.getByText(/장날은 매월|매일 운영|운영 일정은 확인이 필요/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "전국 장날 지도에서 보기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이전 화면" })).toBeInTheDocument();
    expect(container.querySelector('a[href*="when="]')).toBeNull();
    for (const report of container.querySelectorAll('a[href^="/report"]')) expect(report).toHaveAttribute("rel", "nofollow");
    expect(screen.getByRole("button", { name: "공유하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "지도·길찾기" }).closest("[data-mobile-action-bar]")).toBeInTheDocument();
  });

  it("uses MarketNextDate as the single schedule landmark", async () => {
    const market = reviewedMarkets[0];

    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    expect(screen.getByRole("region", { name: "다음 장날" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "운영 일정" })).not.toBeInTheDocument();
  });

  it("공식 집계가 있는 시장의 온누리상품권 가맹점 수를 보여준다", async () => {
    const market = reviewedMarkets.find((item) => item.onnuri !== null)!;

    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    expect(screen.getByRole("heading", { level: 2, name: "온누리상품권" })).toBeInTheDocument();
    expect(screen.getByText(`가맹점 총 ${market.onnuri!.totalCount.toLocaleString("ko-KR")}곳`)).toBeInTheDocument();
  });

  it("links both report scopes from a market page", async () => {
    const market = reviewedMarkets[0];

    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    expect(screen.getByRole("link", { name: "불편 신고" })).toHaveAttribute("href", "/report?kind=service");
    expect(screen.getByRole("link", { name: "온누리상품권" })).toHaveAttribute("href", "/onnuri");
    expect(screen.getByRole("link", { name: "정보가 다른가요? 수정 제보" })).toHaveAttribute(
      "href",
      `/report?kind=market&market=${encodeURIComponent(market.id)}`,
    );
  });

  it("links to other indexable markets in the same region", async () => {
    const market = reviewedMarkets.find((item) => findRelatedMarkets(item).length > 0)!;

    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    expect(screen.getByRole("heading", { name: "같은 지역 장날" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /장날/ }).length).toBeGreaterThan(1);
  });

  it("links periodic markets to their region landing page", async () => {
    const periodic = reviewedMarkets.find((item) => item.name === "청도공설시장")!;
    const { unmount } = render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(periodic) }) }));
    expect(screen.getByRole("link", { name: "경북 장날 전체 보기" })).toHaveAttribute("href", "/jangnal/gyeongbuk");
    unmount();

    const daily = reviewedMarkets.find((item) => item.schedule.kind === "daily")!;
    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(daily) }) }));
    expect(screen.queryByRole("link", { name: /장날 전체 보기/ })).not.toBeInTheDocument();
  });

  it("publishes a postal address and a breadcrumb through the region landing", async () => {
    const { container } = render(await MarketPage({ params: Promise.resolve({ slug: "용인중앙시장-389b4a24" }) }));
    const [place, breadcrumb] = [...container.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.textContent ?? ""));

    expect(place.address).toMatchObject({ "@type": "PostalAddress", addressRegion: "경기도", addressCountry: "KR" });
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(breadcrumb.itemListElement.map((item: { name: string; item?: string }) => [item.name, item.item])).toEqual([
      ["오늘 장날", `${SITE_URL}/`],
      ["장날", `${SITE_URL}/jangnal`],
      ["경기 장날", `${SITE_URL}/jangnal/gyeonggi`],
      ["용인중앙시장", undefined],
    ]);
  });
});
