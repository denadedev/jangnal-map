import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import JangnalHubPage, { generateMetadata } from "./page";

describe("nationwide market-day hub", () => {
  it("links launch regions and all five patterns", async () => {
    render(await JangnalHubPage());
    const regions = screen.getByRole("region", { name: "시·도별 장날" });
    const regionLinks = within(regions).getAllByRole("link");
    expect(regionLinks).toHaveLength(8);
    expect(regionLinks[0]).toHaveAttribute("href", "/jangnal/gyeongbuk");
    const patterns = screen.getByRole("region", { name: "끝자리별 장날" });
    expect(within(patterns).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(
      ["1-6", "2-7", "3-8", "4-9", "5-10"].map((pattern) => `/jangnal/days/${pattern}`),
    );
  });

  it("opens today's map with a button instead of a crawlable query link", async () => {
    const { container } = render(await JangnalHubPage());
    expect(screen.getByRole("button", { name: "지도에서 오늘 열리는 장 보기" })).toBeInTheDocument();
    expect(container.querySelector('a[href*="when="]')).toBeNull();
  });

  it("has canonical metadata", async () => {
    expect((await generateMetadata()).alternates?.canonical).toBe("https://kmarketday.com/jangnal");
  });
});
