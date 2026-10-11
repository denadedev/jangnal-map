import type { Metadata } from "next";
import type { ReactElement } from "react";

import { LegalDocumentPage } from "../../components/legal-document-page";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "이용약관 · 오늘 장날",
  alternates: { canonical: "/terms" },
};

export default function TermsPage(): Promise<ReactElement> {
  return LegalDocumentPage({ kind: "terms", title: "이용약관" });
}
