import type { Metadata } from "next";
import type { ReactElement } from "react";

import { LegalDocumentPage } from "../../components/legal-document-page";

// 빌드 시점의 Hub 장애가 대체 화면으로 굳지 않도록 요청 시 렌더링하고, Hub 응답만 fetch 캐시에 둔다.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이용약관 · 오늘 장날",
  alternates: { canonical: "/terms" },
};

export default function TermsPage(): Promise<ReactElement> {
  return LegalDocumentPage({ kind: "terms", title: "이용약관" });
}
