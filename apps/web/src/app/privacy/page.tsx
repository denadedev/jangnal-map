import type { Metadata } from "next";
import type { ReactElement } from "react";

import { LegalDocumentPage } from "../../components/legal-document-page";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "개인정보 처리방침 · 오늘 장날",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage(): Promise<ReactElement> {
  return LegalDocumentPage({ kind: "privacy", title: "개인정보 처리방침" });
}
