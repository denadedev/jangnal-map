import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jangnal-map.vercel.app"),
  applicationName: "오늘 장날",
  title: { default: "오늘 장날 | 전국 5일장·전통시장 일정 지도", template: "%s" },
  description: "오늘·이번 주·주말에 열리는 전국 5일장과 전통시장을 지도에서 확인하세요. 시장별 장날, 주소, 주차, 전화 정보를 제공합니다.",
  verification: {
    google: "qLxSxOof1dITMeFrrNHReAC51FFUDTPDpCqKSpqJFgY",
    other: {
      "naver-site-verification": "d7bf1253f88fe2410c22eb065f4af604dfccac18",
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
      <body>{children}</body>
    </html>
  );
}
