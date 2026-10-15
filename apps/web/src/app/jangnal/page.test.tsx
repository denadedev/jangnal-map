import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import JangnalHubPage, { metadata } from "./page";

describe("nationwide market-day hub", () => {
  it("links launch regions and all five patterns", () => {
    render(<JangnalHubPage />);
    const regions = screen.getByRole("region", { name: "시·도별 장날" });
    const regionLinks = within(regions).getAllByRole("link");
    expect(regionLinks).toHaveLength(8);
    expect(regionLinks[0]).toHaveAttribute("href", "/jangnal/gyeongbuk");
    const patterns = screen.getByRole("region", { name: "끝자리별 장날" });
    expect(within(patterns).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(
      ["1-6", "2-7", "3-8", "4-9", "5-10"].map((pattern) => `/jangnal/days/${pattern}`),
    );
  });

  it("has canonical metadata", () => {
    expect(metadata.alternates?.canonical).toBe("https://kmarketday.com/jangnal");
  });
});
