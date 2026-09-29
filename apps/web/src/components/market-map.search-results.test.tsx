import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import type { NaverMapsNamespace } from "../lib/naver-maps";
import { MarketMap } from "./market-map";

const market: PublicMarket = {
  id: "tongbok",
  name: "통복시장",
  marketType: "상설장+5일장",
  roadAddress: "경기도 평택시 통복시장로25번길 10",
  lotAddress: null,
  latitude: 36.9978,
  longitude: 127.085,
  scheduleRaw: "5일+10일",
  schedule: { kind: "digit-pair", days: [5, 0] },
  phone: null,
  hasParking: null,
  referenceDate: "2025-11-10",
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source: { name: "공공데이터", url: "https://example.com", referenceDate: "2025-11-10" },
};

afterEach(() => {
  delete window.naver;
  vi.unstubAllGlobals();
});

it("preserves the current map on search until the user requests result movement and can restore it", async () => {
  const morph = vi.fn();
  const fitBounds = vi.fn();
  class FakeLatLng {
    constructor(private latitude: number, private longitude: number) {}
    lat = () => this.latitude;
    lng = () => this.longitude;
  }
  class FakeMap {
    morph = morph;
    fitBounds = fitBounds;
    panTo = vi.fn();
    panBy = vi.fn();
    setOptions = vi.fn();
    getCenter = () => new FakeLatLng(37.55, 126.95);
    getProjection = () => null;
    setZoom = vi.fn();
    getZoom = () => 10;
    getBounds = () => ({
      getNE: () => new FakeLatLng(37.7, 127.1),
      getSW: () => new FakeLatLng(37.4, 126.7),
    });
  }
  class FakeMarker { setMap = vi.fn(); }
  class FakePoint {}
  window.naver = {
    maps: {
      Map: FakeMap,
      LatLng: FakeLatLng,
      Marker: FakeMarker,
      Point: FakePoint,
      Event: { addListener: () => ({}), removeListener: () => undefined },
    },
  } as unknown as NaverMapsNamespace;

  render(<MarketMap
    markets={[]}
    searchQuery="평택"
    searchMarkets={[market, { ...market, id: "seoul", latitude: 37.56, longitude: 126.97 }]}
    referenceDate={new Date(2026, 8, 6)}
    selectedId={null}
    clientId="test"
    onSelect={() => undefined}
    onLocationChange={() => undefined}
  />);

  const move = await screen.findByRole("button", { name: "검색 결과 지도에서 보기" });
  expect(screen.getByText("선택한 날짜에 표시할 장날 핀이 없어요")).toBeInTheDocument();
  expect(morph).not.toHaveBeenCalled();
  expect(fitBounds).not.toHaveBeenCalled();
  await userEvent.click(move);
  expect(fitBounds).toHaveBeenCalledWith({ south: 36.9978, north: 37.56, west: 126.97, east: 127.085 });

  await userEvent.click(await screen.findByRole("button", { name: "이전 지도" }));
  await waitFor(() => expect(morph).toHaveBeenCalledOnce());
  expect(morph.mock.calls[0][0].lat()).toBe(37.55);
  expect(morph.mock.calls[0][0].lng()).toBe(126.95);
});

it("offers a focused map view for matching markets even when they are inside a nationwide viewport", async () => {
  class FakeLatLng {
    constructor(private latitude: number, private longitude: number) {}
    lat = () => this.latitude;
    lng = () => this.longitude;
  }
  class FakeMap {
    morph = vi.fn();
    panTo = vi.fn();
    panBy = vi.fn();
    setOptions = vi.fn();
    getCenter = () => new FakeLatLng(36.35, 127.8);
    getProjection = () => null;
    setZoom = () => undefined;
    getZoom = () => 7;
    getBounds = () => ({ getNE: () => new FakeLatLng(39, 131), getSW: () => new FakeLatLng(33, 124) });
  }
  class FakeMarker { setMap = vi.fn(); }
  class FakePoint {}
  window.naver = {
    maps: {
      Map: FakeMap,
      LatLng: FakeLatLng,
      Marker: FakeMarker,
      Point: FakePoint,
      Event: { addListener: () => ({}), removeListener: () => undefined },
    },
  } as unknown as NaverMapsNamespace;

  render(<MarketMap markets={[market]} searchQuery="평택" searchMarkets={[market]} referenceDate={new Date(2026, 8, 6)} selectedId={null} clientId="test" onSelect={() => undefined} onLocationChange={() => undefined} />);

  expect(await screen.findByRole("button", { name: "검색 결과 지도에서 보기" })).toBeInTheDocument();
});
