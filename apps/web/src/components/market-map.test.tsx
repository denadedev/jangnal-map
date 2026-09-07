import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { NaverMapsNamespace } from "../lib/naver-maps";
import { MarketMap } from "./market-map";

describe("MarketMap current location", () => {
  afterEach(() => {
    delete window.naver;
    vi.unstubAllGlobals();
  });

  it("reports a successful current location to its parent", async () => {
    const panTo = vi.fn();
    const setZoom = vi.fn();
    class FakeMap {
      panTo = panTo;
      setZoom = setZoom;
      getZoom = () => 7;
      getBounds = () => ({
        getNE: () => ({ lat: () => 38, lng: () => 130 }),
        getSW: () => ({ lat: () => 33, lng: () => 124 }),
      });
    }
    class FakeLatLng {}
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
    const getCurrentPosition = vi.fn((success: PositionCallback) => success({
      coords: { latitude: 37.5665, longitude: 126.978 },
    } as GeolocationPosition));
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    const onLocationChange = vi.fn();

    render(<MarketMap
      markets={[]}
      referenceDate={new Date(2026, 8, 7)}
      selectedId={null}
      clientId="test-client-id"
      onSelect={() => undefined}
      onLocationChange={onLocationChange}
    />);

    const button = screen.getByRole("button", { name: "현재 위치로 이동" });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);

    expect(onLocationChange).toHaveBeenCalledWith({ latitude: 37.5665, longitude: 126.978 });
  });
});
