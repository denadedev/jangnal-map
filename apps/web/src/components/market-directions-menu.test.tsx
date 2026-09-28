import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { MarketDirectionsMenu } from "./market-directions-menu";

const market: PublicMarket = {
  id: "sample",
  name: "테스트시장",
  marketType: "5일장",
  roadAddress: "서울특별시 중구 시장길 1",
  lotAddress: null,
  latitude: 37.5,
  longitude: 127,
  scheduleRaw: "2일+7일",
  schedule: { kind: "digit-pair", days: [2, 7] },
  phone: null,
  hasParking: null,
  referenceDate: null,
  status: "운영",
  statusVerified: true,
  onnuri: null,
  source: { name: "출처", url: "https://example.com", referenceDate: null },
};

describe("MarketDirectionsMenu", () => {
  it("offers one trigger with a NAVER route and a Google location", async () => {
    render(<MarketDirectionsMenu market={market} locale="en" />);

    const trigger = screen.getByRole("button", { name: "Maps & directions" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "NAVER Maps — Directions" })).toHaveAttribute(
      "href",
      "https://map.naver.com/p/directions/-/127,37.5,%ED%85%8C%EC%8A%A4%ED%8A%B8%EC%8B%9C%EC%9E%A5/-/car",
    );
    expect(screen.getByRole("link", { name: "Google Maps — View location" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=37.5%2C127",
    );
  });

  it("closes only its own menu on Escape", async () => {
    const outerEscape = vi.fn();
    render(<div onKeyDown={outerEscape}><MarketDirectionsMenu market={market} locale="en" /></div>);
    await userEvent.click(screen.getByRole("button", { name: "Maps & directions" }));

    fireEvent.keyDown(screen.getByRole("link", { name: "Google Maps — View location" }), { key: "Escape" });

    expect(screen.getByRole("button", { name: "Maps & directions" })).toHaveAttribute("aria-expanded", "false");
    expect(outerEscape).not.toHaveBeenCalled();
  });

  it("does not offer directions when coordinates are missing", () => {
    const { container } = render(<MarketDirectionsMenu market={{ ...market, latitude: null }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
