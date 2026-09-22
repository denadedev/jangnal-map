import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { reviewedMarkets } from "../lib/market-editorial";
import HomePage from "./page";

vi.mock("../lib/market-editorial", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/market-editorial")>();
  const indexable = actual.reviewedMarkets[0];
  const excluded = {
    ...actual.reviewedMarkets[1],
    scheduleRaw: "확인 중",
    schedule: { kind: "unknown" as const, raw: "확인 중" },
  };

  return {
    ...actual,
    reviewedMarketIds: new Set([indexable.id, excluded.id]),
    reviewedMarkets: [indexable, excluded],
  };
});

describe("HomePage SEO", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders WebSite structured data with the preferred site name", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain(
      '{"@context":"https://schema.org","@type":"WebSite","name":"오늘 장날","alternateName":["장날 지도","오늘장날"],"url":"https://kmarketday.com"}',
    );
  });

  it("does not link a reviewed market title when its standalone page is not indexable", async () => {
    const user = userEvent.setup();
    const excluded = reviewedMarkets[1];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => reviewedMarkets,
    } as Response));
    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: "전체" }));
    await user.click(await screen.findByRole("link", { name: new RegExp(excluded.name) }));

    const detail = await screen.findByRole("article", { name: `${excluded.name} 상세정보` });
    expect(within(detail).queryByRole("link", { name: excluded.name })).not.toBeInTheDocument();
  });
});
