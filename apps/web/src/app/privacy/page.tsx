import type { Metadata } from "next";
import type { ReactElement } from "react";

import { LegalDocumentPage } from "../../components/legal-document-page";
import { SITE_OPEN_GRAPH } from "../../lib/site-config";

// 빌드 시점의 Hub 장애가 대체 화면으로 굳지 않도록 요청 시 렌더링하고, Hub 응답만 fetch 캐시에 둔다.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | 오늘 장날",
  alternates: { canonical: "/privacy" },
  openGraph: { ...SITE_OPEN_GRAPH, title: "개인정보 처리방침 | 오늘 장날", url: "/privacy" },
};

export default function PrivacyPage(): Promise<ReactElement> {
  return LegalDocumentPage({ kind: "privacy", title: "개인정보 처리방침" });
}
