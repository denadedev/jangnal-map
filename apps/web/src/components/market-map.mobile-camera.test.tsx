import { render, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { NaverMapsNamespace, NaverPoint } from "../lib/naver-maps";
import type { PublicMarket } from "../lib/market";
import { MarketMap } from "./market-map";

const market = (id: string, latitude = 37.5, longitude = 127): PublicMarket => ({
  id,
  name: `${id} 시장`,
  marketType: "5일장",
  roadAddress: "서울특별시 중구 시장길 1",
  lotAddress: null,
  latitude,
  longitude,
  scheduleRaw: "5일+10일",
  schedule: { kind: "digit-pair", days: [5, 0] },
  phone: null,
  hasParking: null,
  referenceDate: "2026-09-01",
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source: { name: "출처", url: "https://example.com", referenceDate: "2026-09-01" },
});

type Listener = { target: unknown; eventName: string; listener: () => void };

function installFakeNaverMap({ zoom = 12, projection = "available" }: { zoom?: number; projection?: "available" | "missing" } = {}) {
  const listeners: Listener[] = [];
  const markerOptions: Array<{ title: string; icon: { content: string } }> = [];
  const panTo = vi.fn();
  const panBy = vi.fn();
  const setZoom = vi.fn();
  const initialCenter = { latitude: 36.35, longitude: 127.8 };
  let center = initialCenter;
  let currentZoom = zoom;
  let projectionAvailable = projection === "available";
  let mapInstance: FakeMap;

  const emit = (target: unknown, eventName: string) => {
    [...listeners].filter((item) => item.target === target && item.eventName === eventName)
      .forEach((item) => item.listener());
  };

  class FakeLatLng {
    constructor(private readonly latitude: number, private readonly longitude: number) {}
    lat = () => this.latitude;
    lng = () => this.longitude;
  }
  class FakePoint implements NaverPoint {
    constructor(public readonly x: number, public readonly y: number) {}
  }
  class FakeMarker {
    constructor(options: { title: string; icon: { content: string } }) { markerOptions.push(options); }
    setMap = vi.fn();
  }
  class FakeMap {
    constructor() { mapInstance = this; }
    morph = vi.fn();
    panTo = vi.fn((position: FakeLatLng) => {
      panTo(position);
      center = { latitude: position.lat(), longitude: position.lng() };
      emit(mapInstance, "idle");
    });
    panBy = vi.fn((point: NaverPoint) => {
      panBy(point);
      center = { latitude: center.latitude + point.y / 1000, longitude: center.longitude + point.x / 1000 };
    });
    setOptions = vi.fn();
    getCenter = () => new FakeLatLng(center.latitude, center.longitude);
    getProjection = () => projectionAvailable
      ? { fromCoordToOffset: () => ({ x: 200, y: 100 }) }
      : null;
    setZoom = vi.fn((nextZoom: number) => {
      setZoom(nextZoom);
      currentZoom = nextZoom;
      emit(mapInstance, "zoom_changed");
    });
    getZoom = () => currentZoom;
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
          const index = listeners.indexOf(listener as Listener);
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

  return {
    get map() { return mapInstance; },
    markerOptions,
    panTo,
    panBy,
    setZoom,
    emit: (eventName: string) => emit(mapInstance, eventName),
    setProjectionAvailable: (available: boolean) => { projectionAvailable = available; },
    clickMarkerContaining: (text: string) => {
      const marker = markerOptions.find((options) => options.icon.content.includes(text));
      if (!marker) throw new Error(`No marker found containing ${text}`);
      const listener = listeners.find((item) => item.target !== mapInstance && item.eventName === "click");
      if (!listener) throw new Error("No marker click listener was registered");
      listener.listener();
    },
  };
}

const renderMap = (props: Partial<ComponentProps<typeof MarketMap>> = {}) => render(
  <MarketMap
    markets={[]}
    referenceDate={new Date(2026, 8, 4)}
    selectedId={null}
    clientId="test-client-id"
    onSelect={() => undefined}
    onLocationChange={() => undefined}
    {...props}
  />,
);

describe("MarketMap mobile camera behavior", () => {
  afterEach(() => {
    delete window.naver;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("restores the saved center and zoom when closing a selection without moving the map", async () => {
    const fake = installFakeNaverMap();
    const onCameraRestoreComplete = vi.fn();
    const view = renderMap({ markets: [market("camera")], onCameraRestoreComplete });

    await waitFor(() => expect(fake.map).toBeTruthy());
    view.rerender(
      <MarketMap
        markets={[market("camera")]}
        referenceDate={new Date(2026, 8, 4)}
        selectedId="camera"
        clientId="test-client-id"
        mobileOcclusion={{ top: 80, bottom: 100 }}
        onSelect={() => undefined}
        onLocationChange={() => undefined}
        onCameraRestoreComplete={onCameraRestoreComplete}
      />,
    );
    await waitFor(() => expect(fake.markerOptions.length).toBeGreaterThan(0));

    view.rerender(
      <MarketMap
        markets={[market("camera")]}
        referenceDate={new Date(2026, 8, 4)}
        selectedId={null}
        clientId="test-client-id"
        mobileOcclusion={null}
        onSelect={() => undefined}
        onLocationChange={() => undefined}
        onCameraRestoreComplete={onCameraRestoreComplete}
      />,
    );

    await waitFor(() => expect(fake.panTo).toHaveBeenCalledWith(expect.objectContaining({
      lat: expect.any(Function),
      lng: expect.any(Function),
    })));
    expect(fake.setZoom).toHaveBeenCalledWith(12);
    await waitFor(() => expect(onCameraRestoreComplete).toHaveBeenCalledWith(true));
  });

  it.each(["dragstart", "zoom_changed"] as const)(
    "keeps the user's map position after a %s gesture instead of restoring the old camera",
    async (gesture) => {
      const fake = installFakeNaverMap();
      const onCameraRestoreComplete = vi.fn();
      const view = renderMap({ markets: [market("camera")], onCameraRestoreComplete });
      await waitFor(() => expect(fake.map).toBeTruthy());

      view.rerender(
        <MarketMap
          markets={[market("camera")]}
          referenceDate={new Date(2026, 8, 4)}
          selectedId="camera"
          clientId="test-client-id"
          mobileOcclusion={null}
          onSelect={() => undefined}
          onLocationChange={() => undefined}
          onCameraRestoreComplete={onCameraRestoreComplete}
        />,
      );
      await waitFor(() => expect(fake.markerOptions.length).toBeGreaterThan(0));
      fake.emit(gesture);

      view.rerender(
        <MarketMap
          markets={[market("camera")]}
          referenceDate={new Date(2026, 8, 4)}
          selectedId={null}
          clientId="test-client-id"
          mobileOcclusion={null}
          onSelect={() => undefined}
          onLocationChange={() => undefined}
          onCameraRestoreComplete={onCameraRestoreComplete}
        />,
      );

      await waitFor(() => expect(onCameraRestoreComplete).toHaveBeenCalledWith(false));
      expect(fake.panTo).not.toHaveBeenCalled();
      expect(fake.setZoom).not.toHaveBeenCalled();
    },
  );

  it("zooms into a selected market when the starting zoom only shows clusters", async () => {
    const fake = installFakeNaverMap({ zoom: 7 });
    renderMap({
      markets: [market("zoom")],
      selectedId: "zoom",
      mobileOcclusion: { top: 80, bottom: 100 },
    });

    await waitFor(() => expect(fake.setZoom).toHaveBeenCalledWith(11));
    await waitFor(() => expect(fake.markerOptions.some((marker) => marker.icon.content.includes("zoom 시장"))).toBe(true));
  });

  it("zooms and recenters a tapped cluster", async () => {
    const fake = installFakeNaverMap({ zoom: 7 });
    renderMap({ markets: [market("cluster-a", 37.5, 127), market("cluster-b", 37.6, 127.1)] });

    await waitFor(() => expect(fake.markerOptions.some((marker) => marker.title.includes("이 지역 시장 2곳"))).toBe(true));
    fake.clickMarkerContaining("이 지역 시장 2곳");

    expect(fake.panTo).toHaveBeenCalledTimes(1);
    expect(fake.setZoom).toHaveBeenCalledWith(9);
  });

  it("keeps the selected market rendered when the map projection is unavailable", async () => {
    const fake = installFakeNaverMap({ projection: "missing" });

    renderMap({
      markets: [market("projection")],
      selectedId: "projection",
      mobileOcclusion: { top: 80, bottom: 100 },
    });

    await waitFor(() => expect(fake.markerOptions.length).toBeGreaterThan(0));
    expect(fake.markerOptions[0].icon.content).toContain("projection 시장");
    expect(fake.panBy).not.toHaveBeenCalled();

    fake.setProjectionAvailable(true);
    fake.emit("idle");
    await waitFor(() => expect(fake.panBy).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 290 })));
  });
});
