import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadCatalog } from "../lib/catalog/load";
import HomePage from "./page";

vi.mock("../lib/catalog/load", async () => {
  const { createCatalog } = await import("../lib/catalog/catalog");
  const { loadJsonSnapshot } = await import("../lib/catalog/json-source");
  const { markets, editorial } = loadJsonSnapshot();
  const [indexable, second] = createCatalog({ markets, editorial, highlights: [] }).reviewedMarkets;
  const excluded = {
    ...second,
    scheduleRaw: "확인 중",
    schedule: { kind: "unknown" as const, raw: "확인 중" },
  };
  const catalog = createCatalog({
    markets: [indexable, excluded],
    editorial: editorial.filter(({ marketId }) => marketId === indexable.id || marketId === excluded.id),
    highlights: [],
  });

  return { loadCatalog: async () => catalog };
});

describe("HomePage SEO", () => {
  it("does not publish placeholder dates or empty results before loading", async () => {
    const html = renderToStaticMarkup(await HomePage());

    expect(html).not.toContain("1/15");
    expect(html).not.toContain("2000-01-15");
    expect(html).not.toContain("시장 0곳");
    expect(html).toContain("시장 정보를 불러오는 중입니다.");
    // 정책 링크는 footer 대신 하단 탭의 더보기(/more)에 있다.
    expect(html).toContain('href="/more"');
    expect(html).not.toContain('href="/about#data-policy"');
    expect(html).toContain('href="#reviewed-market-guides-heading"');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders WebSite structured data with the preferred site name", async () => {
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain(
      '{"@context":"https://schema.org","@type":"WebSite","name":"오늘 장날","alternateName":["장날 지도","오늘장날"],"url":"https://kmarketday.com"}',
    );
  });

  it("does not link a reviewed market title when its standalone page is not indexable", async () => {
    const user = userEvent.setup();
    const { reviewedMarkets } = await loadCatalog();
    const excluded = reviewedMarkets[1];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => reviewedMarkets,
    } as Response));
    render(await HomePage());

    await user.click(screen.getByRole("button", { name: "전체" }));
    await user.click(await screen.findByRole("link", { name: new RegExp(excluded.name) }));

    const detail = await screen.findByRole("article", { name: `${excluded.name} 상세정보` });
    expect(within(detail).queryByRole("link", { name: excluded.name })).not.toBeInTheDocument();
  });
});
