import { preconnect, preload } from "react-dom";

import { naverMapsSdkUrl } from "./naver-maps";

/**
 * 지도 첫 화면에 필요한 시장 목록과 NAVER 지도 SDK를 HTML 단계에서 미리 받기 시작한다.
 * 그동안은 앱 JS가 다 실행된 뒤에야 두 요청이 나가서 마커가 늦게 찍혔다.
 */
export function preloadMapResources(clientId: string): void {
  // 클라이언트의 fetch("/api/markets")와 같은 모드여야 브라우저가 미리 받은 응답을 재사용한다.
  preload("/api/markets", { as: "fetch", crossOrigin: "anonymous" });
  if (!clientId) return;
  preconnect("https://oapi.map.naver.com");
  preload(naverMapsSdkUrl(clientId), { as: "script" });
}
