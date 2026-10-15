import { render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SITE_URL } from "../../../lib/market-seo";
import RegionPage, { generateMetadata, generateStaticParams } from "./page";

const params = (region: string) => ({ params: Promise.resolve({ region }) });

describe("region landing route", () => {
  it("prebuilds the eight launch regions", () => {
    expect(generateStaticParams().map(({ region }) => region).sort()).toEqual(
      ["chungbuk", "chungnam", "gangwon", "gyeongbuk", "gyeonggi", "gyeongnam", "jeonbuk", "jeonnam"],
    );
  });

  it("returns canonical metadata without a calendar date", async () => {
    const metadata = await generateMetadata(params("gyeongbuk"));
    expect(metadata.title).toBe("경북 장날 · 오늘 열리는 5일장 79곳 | 오늘 장날");
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/jangnal/gyeongbuk`);
    expect(String(metadata.description)).not.toMatch(/\d+월 \d+일/);
  });

  it("lists every market by district with reviewed and map links", async () => {
    render(await RegionPage(params("gyeongbuk")));
    const list = screen.getByRole("region", { name: "시·군별 전체 목록" });
    expect(list).toHaveTextContent("79곳");
    expect(within(list).getByText("경주시")).toBeInTheDocument();
    expect(within(list).getByRole("link", { name: /안강공설시장/ }).getAttribute("href")).toMatch(/^\/\?when=all&market=/);
    expect(within(list).getByRole("link", { name: /청도공설시장/ }).getAttribute("href")).toMatch(/^\/markets\//);
  });

  it("renders the data-based introduction and its sources", async () => {
    render(await RegionPage(params("jeonbuk")));
    const intro = screen.getByRole("region", { name: "전북 장날 소개" });
    expect(intro).toHaveTextContent("정기 장날 시장이 34곳");
    expect(within(intro).getByRole("link", { name: "공공데이터포털 전국전통시장표준데이터" })).toHaveAttribute("target", "_blank");
  });

  it("keeps exact dates out of the static HTML", async () => {
    const markup = renderToStaticMarkup(await RegionPage(params("gyeongbuk")));
    expect(markup).not.toMatch(/\d+월 \d+일 [월화수목금토일]요일/);
    expect(markup).not.toContain("D-");
  });

  it("does not render regions outside the launch list", async () => {
    await expect(RegionPage(params("seoul"))).rejects.toThrow();
    await expect(RegionPage(params("unknown"))).rejects.toThrow();
    expect((await generateMetadata(params("seoul"))).robots).toEqual({ index: false, follow: false });
  });
});
