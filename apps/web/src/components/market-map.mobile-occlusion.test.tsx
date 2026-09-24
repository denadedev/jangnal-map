import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { NaverMapsNamespace } from "../lib/naver-maps";
import type { PublicMarket } from "../lib/market";
import { MarketMap } from "./market-map";

const market: PublicMarket = {
  id: "occlusion-market",
  name: "여백확인시장",
  marketType: "5일장",
  roadAddress: "서울특별시 중구 시장길 1",
  lotAddress: null,
  latitude: 37.5,
  longitude: 127,
  scheduleRaw: "5일+10일",
  schedule: { kind: "digit-pair", days: [5, 0] },
  phone: null,
  hasParking: null,
  referenceDate: "2026-09-01",
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source: { name: "출처", url: "https://example.com", referenceDate: "2026-09-01" },
};

function installFakeNaverMap(point: { x: number; y: number }) {
  const listeners: Array<{ target: unknown; eventName: string; listener: () => void }> = [];
  const markerOptions: Array<{ icon: { content: string } }> = [];
  const panBy = vi.fn();
  const setOptions = vi.fn();
  let mapInstance: FakeMap;

  class FakeLatLng {
    constructor(private readonly latitude: number, private readonly longitude: number) {}
    lat = () => this.latitude;
    lng = () => this.longitude;
  }
  class FakePoint {
    constructor(public readonly x: number, public readonly y: number) {}
  }
  class FakeMarker {
    constructor(options: { icon: { content: string } }) { markerOptions.push(options); }
    setMap = vi.fn();
  }
  class FakeMap {
    constructor() { mapInstance = this; }
    setOptions = setOptions;
    panBy = panBy;
    panTo = vi.fn(() => {
      [...listeners].filter((item) => item.target === mapInstance && item.eventName === "idle")
        .forEach((item) => item.listener());
    });
    morph = vi.fn();
    setZoom = vi.fn();
    getZoom = () => 12;
    getCenter = () => new FakeLatLng(36.35, 127.8);
    getProjection = () => ({ fromCoordToOffset: () => point });
    getBounds = () => ({
      getNE: () => ({ lat: () => 38, lng: () => 130 }),
      getSW: () => ({ lat: () => 33, lng: () => 124 }),
    });
  }

  window.naver = {
    maps: {
      Map: FakeMap,
      LatLng: FakeLatLng,
      Marker: FakeMarker,
      Point: FakePoint,
      Event: {
        addListener: (target: unknown, eventName: string, listener: () => void) => {
          const item = { target, eventName, listener };
          listeners.push(item);
          return item;
        },
        removeListener: (listener: unknown) => {
          const index = listeners.indexOf(listener as typeof listeners[number]);
          if (index >= 0) listeners.splice(index, 1);
        },
      },
    },
  } as unknown as NaverMapsNamespace;

  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains("map-canvas")) {
      return { x: 0, y: 0, width: 400, height: 800, top: 0, right: 400, bottom: 800, left: 0, toJSON: () => ({}) } as DOMRect;
    }
    return originalGetBoundingClientRect.call(this);
  });

  return { markerOptions, panBy, setOptions };
}

describe("MarketMap mobile occlusion", () => {
  afterEach(() => {
    delete window.naver;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("pads the map for the toolbar and sheet, pans a hidden selection into view, and tolerates missing matchMedia", async () => {
    vi.stubGlobal("matchMedia", undefined);
    const { markerOptions, panBy, setOptions } = installFakeNaverMap({ x: 200, y: 100 });

    const { container } = render(
      <MarketMap
        markets={[market]}
        referenceDate={new Date(2026, 8, 4)}
        selectedId="occlusion-market"
        clientId="test-client-id"
        mobileOcclusion={{ top: 80, bottom: 100 }}
        onSelect={() => undefined}
        onLocationChange={() => undefined}
      />,
    );

    expect(container.querySelector(".location-control")).toHaveStyle({ top: "90px" });
    await waitFor(() => expect(setOptions).toHaveBeenCalledWith({
      padding: { top: 92, right: 12, bottom: 112, left: 12 },
    }));
    await waitFor(() => expect(panBy).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 290 })));
    expect(markerOptions[0].icon.content).toContain("여백확인시장 상세 보기");
  });

  it("leaves a selected marker alone when it is already inside the visible map area", async () => {
    const { markerOptions, panBy } = installFakeNaverMap({ x: 200, y: 300 });

    render(
      <MarketMap
        markets={[market]}
        referenceDate={new Date(2026, 8, 4)}
        selectedId="occlusion-market"
        clientId="test-client-id"
        mobileOcclusion={{ top: 80, bottom: 100 }}
        onSelect={() => undefined}
        onLocationChange={() => undefined}
      />,
    );

    await waitFor(() => expect(markerOptions.length).toBeGreaterThan(0));
    expect(panBy).not.toHaveBeenCalled();
  });

  it("hides the location control when the mobile sheet covers the full map", () => {
    const { container } = render(
      <MarketMap
        markets={[]}
        referenceDate={new Date(2026, 8, 4)}
        selectedId={null}
        clientId=""
        mobileOcclusion={null}
        onSelect={() => undefined}
        onLocationChange={() => undefined}
      />,
    );

    expect(container.querySelector(".location-control")).toHaveStyle({ display: "none" });
  });
});
