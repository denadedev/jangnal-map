import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SITE_URL } from "../../../../lib/market-seo";
import PatternPage, { generateMetadata, generateStaticParams } from "./page";

const params = (pattern: string) => ({ params: Promise.resolve({ pattern }) });

describe("market-day pattern route", () => {
  it("prebuilds five patterns", () => {
    expect(generateStaticParams()).toEqual(["1-6", "2-7", "3-8", "4-9", "5-10"].map((pattern) => ({ pattern })));
  });

  it("describes the pattern and lists 87 markets by province", async () => {
    render(await PatternPage(params("4-9")));
    expect(screen.getByRole("heading", { level: 1, name: "4·9일장 장날" })).toBeInTheDocument();
    expect(screen.getAllByText(/매월 4일·9일·14일·19일·24일·29일에 열려요/).length).toBeGreaterThan(0);
    const list = screen.getByRole("region", { name: "시·도별 4·9일장" });
    expect(list).toHaveTextContent("87곳");
    expect(within(list).getByText("경북")).toBeInTheDocument();
  });

  it("explains the 31st only on the 1-6 page", async () => {
    const { unmount } = render(await PatternPage(params("1-6")));
    expect(screen.getByText("31일에도 열리나요?")).toBeInTheDocument();
    unmount();
    render(await PatternPage(params("4-9")));
    expect(screen.queryByText("31일에도 열리나요?")).not.toBeInTheDocument();
  });

  it("uses canonical metadata and rejects unknown patterns", async () => {
    expect((await generateMetadata(params("5-10"))).alternates?.canonical).toBe(`${SITE_URL}/jangnal/days/5-10`);
    await expect(PatternPage(params("1-2"))).rejects.toThrow();
  });
});
