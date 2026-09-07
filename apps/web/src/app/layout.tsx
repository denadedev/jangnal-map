import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jangnal-map.vercel.app"),
  applicationName: "오늘 장날",
  title: { default: "오늘 장날 · 전국 전통시장 장날 지도", template: "%s" },
  description: "전국 전통시장의 오늘 장날, 5일장 일정, 주소와 방문 정보를 지도에서 찾아보세요.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "오늘 장날",
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "오늘 장날 · 전국 전통시장 장날 지도",
    description: "전국 전통시장의 장날과 방문 정보를 한눈에 확인하세요.",
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
