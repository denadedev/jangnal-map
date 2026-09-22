import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SITE_HOST, SITE_URL } from "../lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  other: {
    "google-adsense-account": "ca-pub-3237088758901901",
  },
  applicationName: "오늘 장날",
  title: { default: "오늘 장날 | 전국 5일장·전통시장 일정 지도", template: "%s" },
  description: "오늘·이번 주·주말에 열리는 전국 5일장과 전통시장을 지도에서 확인하세요. 시장별 장날, 주소, 주차, 전화 정보를 제공합니다.",
  verification: {
    google: "iTnI4yy_bzEL-eOrfqhBfEo6VusJEs7MgkVCrZpgV_U",
    other: {
      "naver-site-verification": "474ca7369654e9ba939c810a7988fdd9ae455a95",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "오늘 장날",
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "오늘 장날 | 전국 5일장·전통시장 일정 지도",
    description: "오늘·이번 주·주말에 열리는 전국 5일장과 전통시장을 지도에서 확인하세요.",
    url: "/",
    siteName: "오늘 장날",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <script
          data-domains={SITE_HOST}
          data-exclude-search="true"
          data-website-id="43733c6d-a6fe-43e2-ae63-bc3860d7a8f8"
          defer
          src="https://analytics.spamfam.kr/script.js"
        />
      </body>
    </html>
  );
}
