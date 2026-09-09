import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { publicMarkets } from "../../../lib/market-catalog";
import { createMarketSlug, SITE_URL } from "../../../lib/market-seo";
import MarketPage, { generateMetadata, generateStaticParams } from "./page";

describe("market detail route", () => {
  it("prebuilds raw path parameters for every public market", async () => {
    const params = await generateStaticParams();

    expect(params).toHaveLength(1_393);
    expect(new Set(params.map(({ slug }) => slug))).toHaveLength(1_393);
    expect(params).toContainEqual({ slug: "운천전통시장-45b640cc" });
  });

  it("returns canonical schedule metadata without an exact date", async () => {
    const market = publicMarkets.find((item) => item.schedule.kind === "digit-pair")!;
    const slug = createMarketSlug(market);

    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });

    expect(metadata.title).toContain("장날");
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/markets/${slug}`);
    expect(metadata.openGraph?.url).toBe(`${SITE_URL}/markets/${slug}`);
    expect(metadata.description).toContain("일장");
  });

  it("marks unknown schedules as noindex", async () => {
    const market = publicMarkets.find((item) => item.schedule.kind === "unknown")!;

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: createMarketSlug(market) }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("renders a selected-map link for a valid market", async () => {
    const market = publicMarkets[0];

    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    expect(screen.getByRole("heading", { name: market.name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전국 장날 지도에서 보기" })).toHaveAttribute(
      "href",
      `/?when=all&market=${market.id}`,
    );
  });

  it("uses MarketNextDate as the single schedule landmark", async () => {
    const market = publicMarkets[0];

    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    expect(screen.getByRole("region", { name: "다음 장날" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "운영 일정" })).not.toBeInTheDocument();
  });

  it("공식 집계가 있는 시장의 온누리상품권 가맹점 수를 보여준다", async () => {
    const market = publicMarkets.find((item) => item.onnuri !== null)!;

    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    expect(screen.getByRole("heading", { level: 2, name: "온누리상품권" })).toBeInTheDocument();
    expect(screen.getByText(`가맹점 총 ${market.onnuri!.totalCount.toLocaleString("ko-KR")}곳`)).toBeInTheDocument();
  });

  it("links both report scopes from a market page", async () => {
    const market = publicMarkets[0];

    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));

    expect(screen.getByRole("link", { name: "불편 신고" })).toHaveAttribute("href", "/report?kind=service");
    expect(screen.getByRole("link", { name: "온누리상품권" })).toHaveAttribute("href", "/onnuri");
    expect(screen.getByRole("link", { name: "정보가 다른가요? 수정 제보" })).toHaveAttribute(
      "href",
      `/report?kind=market&market=${encodeURIComponent(market.id)}`,
    );
  });
});
