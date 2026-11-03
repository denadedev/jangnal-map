import type { Metadata } from "next";

export const SITE_URL = "https://kmarketday.com";
export const SITE_HOST = new URL(SITE_URL).hostname;
export const OG_IMAGE = { url: "/og-image.png", width: 1200, height: 630, alt: "오늘 장날 — 전국 5일장·전통시장 일정 지도" };
/** 사이트 기본 Open Graph. url은 넣지 않는다. 페이지마다 자기 주소를 붙여 쓴다. */
export const SITE_OPEN_GRAPH: NonNullable<Metadata["openGraph"]> = {
  images: [OG_IMAGE],
  title: "오늘 장날 | 전국 5일장·전통시장 일정 지도",
  description: "오늘·이번 주·주말에 열리는 전국 5일장과 전통시장을 지도에서 확인하세요.",
  siteName: "오늘 장날",
  locale: "ko_KR",
  type: "website",
};
