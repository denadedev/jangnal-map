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
});
