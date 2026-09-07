export interface NaverMapInstance {
  morph: (position: NaverLatLng, zoom: number) => void;
  panTo: (position: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  getBounds: () => NaverBounds;
}

export interface NaverLatLng {
  readonly __naverLatLng?: never;
}

export interface NaverBounds {
  getNE: () => { lat: () => number; lng: () => number };
  getSW: () => { lat: () => number; lng: () => number };
}

export interface NaverMarker {
  setMap: (map: NaverMapInstance | null) => void;
}

export interface NaverMapsNamespace {
  maps: {
    Map: new (element: HTMLElement, options: { center: NaverLatLng; zoom: number; minZoom?: number }) => NaverMapInstance;
    LatLng: new (latitude: number, longitude: number) => NaverLatLng;
    Marker: new (options: {
      map: NaverMapInstance;
      position: NaverLatLng;
      title: string;
      icon: { content: string; anchor?: unknown };
      zIndex?: number;
    }) => NaverMarker;
    Point: new (x: number, y: number) => unknown;
    Event: {
      addListener: (target: NaverMarker | NaverMapInstance, eventName: string, listener: () => void) => unknown;
      removeListener: (listener: unknown) => void;
    };
  };
}

declare global {
  interface Window {
    naver?: NaverMapsNamespace;
  }
}

let sdkPromise: Promise<NaverMapsNamespace> | null = null;
const sdkLoadTimeoutMs = 10_000;

export function loadNaverMaps(clientId: string): Promise<NaverMapsNamespace> {
  if (window.naver?.maps) return Promise.resolve(window.naver);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-naver-maps="true"]');
    const script = existingScript ?? document.createElement("script");
    let settled = false;
    let timeoutId: number | undefined;

    const cleanup = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      script.removeEventListener("load", resolveLoad);
      script.removeEventListener("error", rejectLoad);
    };
    const rejectLoad = () => {
      if (settled) return;
      settled = true;
      cleanup();
      script.remove();
      sdkPromise = null;
      reject(new Error("NAVER 지도 SDK를 불러오지 못했습니다."));
    };
    const resolveLoad = () => {
      if (settled) return;
      if (!window.naver?.maps) {
        rejectLoad();
        return;
      }
      settled = true;
      cleanup();
      resolve(window.naver);
    };

    script.addEventListener("load", resolveLoad);
    script.addEventListener("error", rejectLoad);
    if (!existingScript) {
      script.dataset.naverMaps = "true";
      script.async = true;
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
      document.head.append(script);
    }
    timeoutId = window.setTimeout(rejectLoad, sdkLoadTimeoutMs);
  });

  return sdkPromise;
}
