import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { NaverMapsNamespace } from "../lib/naver-maps";
import { MarketMap } from "./market-map";

describe("MarketMap current location", () => {
  afterEach(() => {
    delete window.naver;
    vi.unstubAllGlobals();
  });

  it.each(["ko", "en"] as const)("scrolls with one finger and pans with two without a mode button (%s)", async (locale) => {
    const mapOptions = vi.fn();
    const setOptions = vi.fn();
    const panBy = vi.fn();
    class FakeMap {
      constructor(_element: HTMLElement, options: unknown) { mapOptions(options); }
      setOptions = setOptions;
      panBy = panBy;
      getZoom = () => 7;
      getBounds = () => ({
        getNE: () => ({ lat: () => 38, lng: () => 130 }),
        getSW: () => ({ lat: () => 33, lng: () => 124 }),
      });
    }
    window.naver = {
      maps: {
        Map: FakeMap,
        LatLng: class FakeLatLng {},
        Marker: class FakeMarker { setMap = vi.fn(); },
        Point: class FakePoint { constructor(public x: number, public y: number) {} },
        Event: { addListener: () => ({}), removeListener: () => undefined },
      },
    } as unknown as NaverMapsNamespace;

    const view = render(<MarketMap
      locale={locale}
      markets={[]}
      referenceDate={new Date(2026, 8, 7)}
      selectedId={null}
      clientId="test-client-id"
      onSelect={() => undefined}
      onLocationChange={() => undefined}
    />);

    await waitFor(() => expect(mapOptions).toHaveBeenCalledWith(expect.objectContaining({ draggable: true, scrollWheel: false, pinchZoom: true, disableTwoFingerTapZoom: true })));
    expect(screen.queryByRole("button", { name: /지도 이동|이동 완료|Move map|Done moving/ })).not.toBeInTheDocument();
    const canvas = document.querySelector(".map-canvas")!;
    expect(fireEvent.touchStart(canvas, { touches: [{ clientX: 100, clientY: 100 }] })).toBe(true);
    expect(setOptions).toHaveBeenLastCalledWith({ draggable: false });
    expect(fireEvent.touchMove(canvas, { touches: [{ clientX: 100, clientY: 70 }] })).toBe(true);
    expect(panBy).not.toHaveBeenCalled();

    expect(fireEvent.touchStart(canvas, { touches: [{ clientX: 100, clientY: 100 }, { clientX: 200, clientY: 100 }] })).toBe(false);
    expect(fireEvent.touchMove(canvas, { touches: [{ clientX: 120, clientY: 70 }, { clientX: 220, clientY: 70 }] })).toBe(false);
    expect(panBy).toHaveBeenLastCalledWith(expect.objectContaining({ x: 20, y: -30 }));
    expect(panBy).toHaveBeenCalledTimes(1);

    fireEvent.touchEnd(canvas, { touches: [{ clientX: 120, clientY: 70 }] });
    expect(fireEvent.touchMove(canvas, { touches: [{ clientX: 120, clientY: 40 }] })).toBe(true);
    expect(panBy).toHaveBeenCalledTimes(1);
    fireEvent.touchEnd(canvas, { touches: [] });
    expect(setOptions).toHaveBeenLastCalledWith({ draggable: true });

    fireEvent.touchStart(canvas, { touches: [{ clientX: 30, clientY: 40 }, { clientX: 130, clientY: 40 }] });
    fireEvent.touchMove(canvas, { touches: [{ clientX: 20, clientY: 55 }, { clientX: 120, clientY: 55 }] });
    expect(panBy).toHaveBeenLastCalledWith(expect.objectContaining({ x: -10, y: 15 }));
    fireEvent.touchCancel(canvas, { touches: [] });
    expect(setOptions).toHaveBeenLastCalledWith({ draggable: true });
    expect(fireEvent.touchMove(canvas, { touches: [{ clientX: 20, clientY: 60 }] })).toBe(true);
    expect(panBy).toHaveBeenCalledTimes(2);
    expect(mapOptions).toHaveBeenCalledTimes(1);
    view.unmount();
    fireEvent.touchStart(canvas, { touches: [{ clientX: 30, clientY: 40 }, { clientX: 130, clientY: 40 }] });
    fireEvent.touchMove(canvas, { touches: [{ clientX: 50, clientY: 40 }, { clientX: 150, clientY: 40 }] });
    expect(panBy).toHaveBeenCalledTimes(2);
  });

  it("reports a successful current location to its parent", async () => {
    const panTo = vi.fn();
    const setZoom = vi.fn();
    const morph = vi.fn();
    class FakeMap {
      panTo = panTo;
      setZoom = setZoom;
      morph = morph;
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
    expect(morph).toHaveBeenCalledWith(expect.any(FakeLatLng), 14);
    expect(panTo).not.toHaveBeenCalled();
    expect(setZoom).not.toHaveBeenCalled();
  });

  it("reports denied location permission so the parent can focus region search", async () => {
    class FakeMap {
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
    const getCurrentPosition = vi.fn((_success: PositionCallback, failure: PositionErrorCallback) => failure({
      code: 1,
      message: "denied",
    } as GeolocationPositionError));
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    const onLocationError = vi.fn();

    render(<MarketMap
      markets={[]}
      referenceDate={new Date(2026, 8, 7)}
      selectedId={null}
      clientId="test-client-id"
      onSelect={() => undefined}
      onLocationChange={() => undefined}
      onLocationError={onLocationError}
    />);

    const button = screen.getByRole("button", { name: "현재 위치로 이동" });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);

    expect(onLocationError).toHaveBeenCalledWith(expect.stringContaining("위치 권한"), true);
  });
});
