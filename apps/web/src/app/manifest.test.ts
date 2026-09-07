import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("web app manifest", () => {
  it("provides a standalone mobile home-screen experience with install icons", () => {
    expect(manifest()).toEqual({
      name: "오늘 장날",
      short_name: "장날 지도",
      description: "전국 전통시장의 장날과 방문 정보를 한눈에 확인하세요.",
      start_url: "/",
      display: "standalone",
      background_color: "#f6f1e8",
      theme_color: "#d8502a",
      lang: "ko-KR",
      icons: [
        {
          src: "/web-app-manifest-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/web-app-manifest-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });
  });
});
