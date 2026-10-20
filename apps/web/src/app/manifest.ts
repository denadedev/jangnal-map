import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "오늘 장날",
    short_name: "오늘 장날",
    description: "전국 전통시장의 장날과 방문 정보를 한눈에 확인하세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f4f7",
    theme_color: "#c1291f",
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
      {
        src: "/web-app-manifest-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
