import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PublicMarket } from "../lib/market";
import { MarketList } from "./market-list";

const market: PublicMarket = {
  id: "nearby",
  name: "가까운시장",
  marketType: "정기시장",
  roadAddress: "서울특별시 테스트로 1",
  lotAddress: null,
  latitude: 37.01,
  longitude: 127,
  scheduleRaw: "2일+7일",
  schedule: { kind: "digit-pair", days: [2, 7] },
  phone: null,
  hasParking: null,
  referenceDate: null,
  status: "운영",
  statusVerified: true,
  onnuri: null,
  source: { name: "테스트", url: "https://example.com", referenceDate: null },
};

describe("MarketList", () => {
  it("links every market name to its canonical detail page", () => {
    render(<MarketList
      markets={[market]}
      referenceDate={new Date(2026, 8, 7)}
      selectedId={null}
      onSelect={() => undefined}
      onReset={() => undefined}
      currentLocation={null}
    />);

    expect(screen.getByRole("link", { name: /가까운시장/ })).toHaveAttribute(
      "href",
      "/markets/가까운시장-nearby",
    );
  });

  it("shows straight-line distance when a current location is available", () => {
    render(<MarketList
      markets={[market]}
      referenceDate={new Date(2026, 8, 7)}
      selectedId={null}
      onSelect={() => undefined}
      onReset={() => undefined}
      currentLocation={{ latitude: 37, longitude: 127 }}
    />);

    expect(screen.getByText("1.1km")).toBeInTheDocument();
  });
});
