import { act, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import type { NaverMapsNamespace } from "../lib/naver-maps";
import { MarketMap } from "./market-map";

afterEach(() => {
  delete window.naver;
  vi.unstubAllGlobals();
});

it("resizes the map when its hidden canvas becomes visible again", async () => {
  const autoResize = vi.fn();
  let notifyResize: ResizeObserverCallback | undefined;
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { notifyResize = callback; }
    observe = vi.fn();
    disconnect = vi.fn();
  });
  class FakeLatLng {
    constructor(private latitude: number, private longitude: number) {}
    lat = () => this.latitude;
    lng = () => this.longitude;
  }
  class FakeMap {
    autoResize = autoResize;
    morph = vi.fn();
    fitBounds = vi.fn();
    panTo = vi.fn();
    panBy = vi.fn();
    setOptions = vi.fn();
    getCenter = () => new FakeLatLng(36.35, 127.8);
    getProjection = () => null;
    setZoom = vi.fn();
    getZoom = () => 7;
    getBounds = () => ({ getNE: () => new FakeLatLng(39, 131), getSW: () => new FakeLatLng(33, 124) });
  }
  window.naver = { maps: {
    Map: FakeMap,
    LatLng: FakeLatLng,
    Marker: class { setMap = vi.fn(); },
    Point: class {},
    Event: { addListener: () => ({}), removeListener: () => undefined },
  } } as unknown as NaverMapsNamespace;

  render(<MarketMap markets={[]} referenceDate={new Date(2026, 8, 29)} selectedId={null} clientId="test" onSelect={() => undefined} onLocationChange={() => undefined} />);
  await waitFor(() => expect(notifyResize).toBeDefined());
  act(() => notifyResize?.([{ contentRect: { width: 0, height: 0 } } as ResizeObserverEntry], {} as ResizeObserver));
  expect(autoResize).not.toHaveBeenCalled();
  act(() => notifyResize?.([{ contentRect: { width: 350, height: 290 } } as ResizeObserverEntry], {} as ResizeObserver));
  expect(autoResize).toHaveBeenCalledOnce();
});
