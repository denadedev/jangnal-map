export interface NaverMapInstance {
  panTo: (position: NaverLatLng) => void;
}

export interface NaverLatLng {
  readonly __naverLatLng?: never;
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
      addListener: (target: NaverMarker, eventName: string, listener: () => void) => unknown;
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

export function loadNaverMaps(clientId: string): Promise<NaverMapsNamespace> {
  if (window.naver?.maps) return Promise.resolve(window.naver);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-naver-maps="true"]');
    const script = existingScript ?? document.createElement("script");
    const rejectLoad = () => {
      sdkPromise = null;
      reject(new Error("NAVER 지도 SDK를 불러오지 못했습니다."));
    };
    const resolveLoad = () => window.naver?.maps ? resolve(window.naver) : rejectLoad();

    script.addEventListener("load", resolveLoad, { once: true });
    script.addEventListener("error", rejectLoad, { once: true });
    if (!existingScript) {
      script.dataset.naverMaps = "true";
      script.async = true;
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
      document.head.append(script);
    }
  });

  return sdkPromise;
}
