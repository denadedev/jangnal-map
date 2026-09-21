import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { NaverMapsNamespace } from "../lib/naver-maps";
import { MarketMap } from "./market-map";

describe("MarketMap mobile selection regression", () => {
  afterEach(() => {
    delete window.naver;
    vi.unstubAllGlobals();
  });

  it("moves a selected market above the open mobile sheet", async () => {
    const panTo = vi.fn();
    const panBy = vi.fn();
    class FakeMap {
      panTo = panTo;
      panBy = panBy;
      getZoom = () => 12;
      getBounds = () => ({
        getNE: () => ({ lat: () => 38, lng: () => 130 }),
        getSW: () => ({ lat: () => 33, lng: () => 124 }),
      });
    }
    class FakeLatLng {}
    class FakeMarker { setMap = vi.fn(); }
    class FakePoint {
      constructor(public readonly x: number, public readonly y: number) {}
    }
    window.naver = {
      maps: {
        Map: FakeMap,
        LatLng: FakeLatLng,
        Marker: FakeMarker,
        Point: FakePoint,
        Event: { addListener: () => ({}), removeListener: () => undefined },
      },
    } as unknown as NaverMapsNamespace;

    render(
      <MarketMap
        markets={[{
          id: "selected-market",
          name: "선택시장",
          marketType: "5일장",
          roadAddress: "서울특별시 중구 시장길 1",
          lotAddress: null,
          latitude: 37.5,
          longitude: 127,
          scheduleRaw: "5일+10일",
          schedule: { kind: "digit-pair", days: [5, 0] },
          phone: null,
          hasParking: null,
          referenceDate: "2025-11-10",
          status: "운영",
          statusVerified: false,
          onnuri: null,
          source: { name: "출처", url: "https://example.com", referenceDate: "2025-11-10" },
        }]}
        referenceDate={new Date(2026, 8, 7)}
        selectedId="selected-market"
        clientId="test-client-id"
        mobileSheetHeight={200}
        onSelect={() => undefined}
        onLocationChange={() => undefined}
      />,
    );

    await waitFor(() => expect(panTo).toHaveBeenCalled());
    expect(panBy).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: -100 }));
  });
});
