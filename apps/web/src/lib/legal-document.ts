export const LEGAL_HUB_URL = "https://legal-hub.denadedev.workers.dev";

export type LegalDocumentKind = "privacy" | "terms";

const ONE_DAY_SECONDS = 86_400;

export const getLegalDocumentUrl = (kind: LegalDocumentKind): string => `${LEGAL_HUB_URL}/kmarketday/${kind}/`;

// Legal Hub 문서에서 본문 article만 남기고, 허브 내비게이션·인쇄 버튼·스크립트를 제거한다.
export const extractLegalDocumentHtml = (html: string): string | undefined => {
  const article = /<article class="document">([\s\S]*?)<\/article>/.exec(html)?.[1];
  if (!article) return undefined;

  return article
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<nav class="breadcrumbs">[\s\S]*?<\/nav>/, "")
    .replace(/<button[\s\S]*?<\/button>/gi, "")
    .replace(/\son[a-z]+="[^"]*"/gi, "")
    .replace(/href="\/(?!\/)/g, `href="${LEGAL_HUB_URL}/`)
    .trim();
};

export const fetchLegalDocumentHtml = async (kind: LegalDocumentKind): Promise<string | undefined> => {
  try {
    const response = await fetch(getLegalDocumentUrl(kind), { next: { revalidate: ONE_DAY_SECONDS } });
    if (!response.ok) return undefined;
    return extractLegalDocumentHtml(await response.text());
  } catch {
    // 허브 장애 시 페이지는 원문 링크로 대체한다.
    return undefined;
  }
};
