import type { ReactElement } from "react";

import { MobileAppBar } from "./mobile-app-bar";
import { SiteFooter } from "./site-footer";
import styles from "./legal-document-page.module.css";
import { fetchLegalDocumentHtml, getLegalDocumentUrl, type LegalDocumentKind } from "../lib/legal-document";

interface LegalDocumentPageProps {
  kind: LegalDocumentKind;
  title: string;
}

export async function LegalDocumentPage({ kind, title }: LegalDocumentPageProps): Promise<ReactElement> {
  const html = await fetchLegalDocumentHtml(kind);

  return (
    <>
      <MobileAppBar title={title} backHref="/" />
      <main className={styles.page}>
        <a className={styles.back} href="/">← 오늘 장날로 돌아가기</a>
        {html ? (
          // Legal Hub는 운영자가 직접 관리하는 문서이며, 스크립트와 이벤트 속성은 추출 단계에서 제거한다.
          <article className={styles.card} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <article className={styles.card}>
            <h1>{title}</h1>
            <p>문서를 불러오지 못했습니다. <a href={getLegalDocumentUrl(kind)}>{title} 원문 보기</a></p>
          </article>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
